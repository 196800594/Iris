//! # iris_desktop_lib —— Tauri 应用核心（计划书 8.3 桌面端）
//!
//! 职责：
//! - 注册系统通知（tauri-plugin-notification）与本地 SQLite（tauri-plugin-sql）插件；
//! - 暴露三个 keyring 命令给前端：令牌（access/refresh）写入操作系统凭据管理器
//!   （Windows = 凭据管理器），**不落业务库、不写 localStorage**（浏览器调试时前端有 localStorage 兜底）；
//! - 暴露窗口控制命令（最小化/最大化切换/关闭），作用于**调用命令的当前窗口**，
//!   配合前端自定义标题栏（decorations=false）；
//! - 微信式双窗口：login 窗口（启动时显示）+ main 窗口（登录后动态创建），
//!   通过 open_main_window / back_to_login 在两窗之间切换。

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Emitter, Manager, RunEvent, Runtime, WebviewUrl, WebviewWindowBuilder, Window};

/// 全局内存存储：跨窗口共享令牌（同一进程内）。
static SECRETS: Mutex<Option<HashMap<String, String>>> = Mutex::new(None);

/// 全局 SQLite 连接（消息缓存）。
static DB: Mutex<Option<rusqlite::Connection>> = Mutex::new(None);

/// 是否允许真正退出进程。
/// - 平时关闭主窗口只是隐藏到托盘，拦截 ExitRequested；
/// - 登录窗被关闭、或托盘「退出蝶语」时置位后放行。
static ALLOW_EXIT: AtomicBool = AtomicBool::new(false);

/// 是否正处于「登录成功 → 销毁登录窗 → 创建主窗」的切换中。
/// 此期间登录窗的 Destroyed 是正常流程，不能退出应用。
static OPENING_MAIN: AtomicBool = AtomicBool::new(false);

/// 当前在线状态（online / away / busy / dnd / invisible），托盘与前端共享。
static PRESENCE: Mutex<&'static str> = Mutex::new("online");

/// 在线状态元数据：(菜单 id 后缀, 中文名, 托盘提示)。
const PRESENCES: [(&str, &str, &str); 5] = [
    ("online", "我在线上", "我在线上"),
    ("away", "离开", "离开"),
    ("busy", "忙碌", "忙碌"),
    ("dnd", "请勿打扰", "请勿打扰"),
    ("invisible", "隐身", "隐身"),
];

/// 获取持久化文件路径（用户数据目录下的 secrets.json）。
fn secrets_file(app: &AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("iris"));
    let _ = std::fs::create_dir_all(&dir);
    dir.join("secrets.json")
}

/// 从文件加载所有秘密到内存。
fn load_secrets(app: &AppHandle) -> HashMap<String, String> {
    let path = secrets_file(app);
    match std::fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => HashMap::new(),
    }
}

/// 把内存中的所有秘密写入文件。
fn persist_secrets(app: &AppHandle, map: &HashMap<String, String>) {
    let path = secrets_file(app);
    if let Ok(json) = serde_json::to_string(map) {
        let _ = std::fs::write(&path, json);
    }
}

/// 确保内存已加载（懒加载：首次访问时从文件读入）。
fn ensure_loaded(app: &AppHandle) {
    let mut guard = SECRETS.lock().unwrap();
    if guard.is_none() {
        *guard = Some(load_secrets(app));
    }
}

/// 写入秘密（令牌等）；同名条目覆盖。内存 + 文件双写。
#[tauri::command]
fn save_secret(app: AppHandle, key: String, value: String) -> Result<(), String> {
    ensure_loaded(&app);
    let mut guard = SECRETS.lock().unwrap();
    let map = guard.as_mut().unwrap();
    map.insert(key.clone(), value);
    persist_secrets(&app, map);
    eprintln!("[save_secret] key={key} 已写入内存+文件");
    Ok(())
}

/// 读取秘密；不存在时返回 null（前端按"未登录"处理）。
#[tauri::command]
fn get_secret(app: AppHandle, key: String) -> Result<Option<String>, String> {
    ensure_loaded(&app);
    let guard = SECRETS.lock().unwrap();
    let map = guard.as_ref().unwrap();
    match map.get(&key) {
        Some(v) => {
            eprintln!("[get_secret] key={key} 命中, len={}", v.len());
            Ok(Some(v.clone()))
        }
        None => {
            eprintln!("[get_secret] key={key} 不存在");
            Ok(None)
        }
    }
}

/// WebView2 独立数据目录：每个窗口用不同目录，避免 WebView2 "资源在使用中" 错误。
fn webview_data_dir(label: &str) -> std::path::PathBuf {
    let mut dir = std::env::temp_dir();
    dir.push(format!("iris-webview-{label}"));
    dir
}

/// 构造应用页面 URL：
/// - dev 模式：devUrl + path（如 http://localhost:1420/index.html）
/// - prod 模式：WebviewUrl::App(path)
fn app_url<R: Runtime>(app: &AppHandle<R>, path: &str) -> WebviewUrl {
    if let Some(dev_url) = app.config().build.dev_url.as_ref() {
        if let Ok(url) = dev_url.join(path) {
            eprintln!("[window] dev URL for '{path}': {url}");
            return WebviewUrl::External(url);
        }
    }
    eprintln!("[window] prod path: {path}");
    WebviewUrl::App(path.into())
}

/// 延迟销毁指定窗口（在独立线程中，避开 invoke 回调自销毁的 IPC 死锁）。
#[allow(dead_code)]
fn destroy_window_later<R: Runtime>(app: AppHandle<R>, label: &'static str) {
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(200));
        match app.get_webview_window(label) {
            Some(win) => {
                if let Err(e) = win.destroy() {
                    eprintln!("[window] destroy '{label}' failed: {e}");
                } else {
                    eprintln!("[window] destroyed '{label}'");
                }
            }
            None => eprintln!("[window] '{label}' not found, skip destroy"),
        }
    });
}

/// 前端调试日志：输出到 Rust 终端（便于排查主窗口 boot 失败）。
#[tauri::command]
fn debug_log(message: String) {
    eprintln!("[frontend] {message}");
}

/// 删除秘密（登出/令牌失效）；条目不存在视为成功。
#[tauri::command]
fn delete_secret(app: AppHandle, key: String) -> Result<(), String> {
    ensure_loaded(&app);
    let mut guard = SECRETS.lock().unwrap();
    let map = guard.as_mut().unwrap();
    map.remove(&key);
    persist_secrets(&app, map);
    eprintln!("[delete_secret] key={key} 已删除");
    Ok(())
}

// ========== SQLite 消息缓存（rusqlite，绕过 tauri-plugin-sql 的权限问题） ==========

/// 获取数据库文件路径（app_data_dir/iris.db）。
fn db_path(app: &AppHandle) -> std::path::PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir().join("iris"));
    let _ = std::fs::create_dir_all(&dir);
    dir.join("iris.db")
}

/// 初始化数据库：创建连接 + 建表。
#[tauri::command]
fn db_init(app: AppHandle) -> Result<(), String> {
    let path = db_path(&app);
    eprintln!("[db_init] path: {:?}", path);
    let conn = rusqlite::Connection::open(&path).map_err(|e| format!("打开数据库失败: {e}"))?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS msg_cache (
           conv_id TEXT NOT NULL,
           seq     INTEGER NOT NULL,
           msg     TEXT NOT NULL,
           PRIMARY KEY (conv_id, seq)
         ) WITHOUT ROWID;
         CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
         CREATE INDEX IF NOT EXISTS idx_msg_cache_conv ON msg_cache(conv_id, seq);",
    )
    .map_err(|e| format!("建表失败: {e}"))?;
    let mut guard = DB.lock().unwrap();
    *guard = Some(conn);
    eprintln!("[db_init] 数据库初始化成功");
    Ok(())
}

/// 批量幂等写入消息。
#[tauri::command]
fn db_cache_messages(conv_id: String, msgs: Vec<(i64, String)>) -> Result<usize, String> {
    let guard = DB.lock().unwrap();
    let conn = guard.as_ref().ok_or("数据库未初始化")?;
    let mut count = 0;
    for (seq, msg) in &msgs {
        if *seq <= 0 {
            continue;
        }
        conn.execute(
            "INSERT OR REPLACE INTO msg_cache(conv_id, seq, msg) VALUES (?1, ?2, ?3)",
            rusqlite::params![conv_id, seq, msg],
        )
        .map_err(|e| format!("写入消息失败: {e}"))?;
        count += 1;
    }
    Ok(count)
}

/// 读取本地缓存消息（seq 升序）。
#[tauri::command]
fn db_get_messages(conv_id: String) -> Result<Vec<String>, String> {
    let guard = DB.lock().unwrap();
    let conn = guard.as_ref().ok_or("数据库未初始化")?;
    let mut stmt = conn
        .prepare("SELECT msg FROM msg_cache WHERE conv_id = ?1 ORDER BY seq ASC")
        .map_err(|e| format!("查询失败: {e}"))?;
    let rows = stmt
        .query_map(rusqlite::params![conv_id], |row| row.get::<_, String>(0))
        .map_err(|e| format!("查询失败: {e}"))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(row.map_err(|e| format!("读取行失败: {e}"))?);
    }
    Ok(result)
}

/// 本地已知最大 seq（conv.sync 差量游标；无缓存返回 0）。
#[tauri::command]
fn db_cached_max_seq(conv_id: String) -> Result<i64, String> {
    let guard = DB.lock().unwrap();
    let conn = guard.as_ref().ok_or("数据库未初始化")?;
    let seq: i64 = conn
        .query_row(
            "SELECT COALESCE(MAX(seq), 0) FROM msg_cache WHERE conv_id = ?1",
            rusqlite::params![conv_id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    Ok(seq)
}

/// 最小化**调用该命令的当前窗口**。
#[tauri::command]
fn win_minimize<R: Runtime>(window: Window<R>) -> Result<(), String> {
    window.minimize().map_err(|e| format!("最小化失败: {e}"))
}

/// 切换当前窗口最大化状态；返回当前是否最大化。
#[tauri::command]
fn win_toggle_maximize<R: Runtime>(window: Window<R>) -> Result<bool, String> {
    let maximized = window
        .is_maximized()
        .map_err(|e| format!("查询最大化状态失败: {e}"))?;
    if maximized {
        window.unmaximize().map_err(|e| format!("还原窗口失败: {e}"))?;
    } else {
        window.maximize().map_err(|e| format!("最大化失败: {e}"))?;
    }
    Ok(!maximized)
}

/// 关闭**调用该命令的当前窗口**（强制 destroy，避免 close 事件被拦截导致窗口残留）。
#[tauri::command]
fn win_close<R: Runtime>(window: Window<R>) -> Result<(), String> {
    window.destroy().map_err(|e| format!("关闭窗口失败: {e}"))
}

/// 隐藏**调用该命令的当前窗口**到系统托盘（不销毁，WebView 与 WS 保持存活）。
#[tauri::command]
fn win_hide<R: Runtime>(window: Window<R>) -> Result<(), String> {
    window.hide().map_err(|e| format!("隐藏窗口失败: {e}"))
}

/// 登录成功后打开主窗口。
/// 全部窗口操作放在独立线程：先销毁 login，再创建 main，避免 WebView2 多实例冲突和 IPC 死锁。
#[tauri::command]
fn open_main_window<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    eprintln!("[open_main_window] called");
    let app_clone = app.clone();
    std::thread::spawn(move || {
        // 进入登录窗→主窗切换流程：阻止 login 的 Destroyed 触发退出
        OPENING_MAIN.store(true, Ordering::SeqCst);
        // 1. 先销毁登录窗
        if let Some(login) = app_clone.get_webview_window("login") {
            if let Err(e) = login.destroy() {
                eprintln!("[open_main_window] destroy login failed: {e}");
            } else {
                eprintln!("[open_main_window] login destroyed");
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(200));

        // 2. 再创建主窗口
        if let Some(win) = app_clone.get_webview_window("main") {
            eprintln!("[open_main_window] main exists, show & focus");
            let _ = win.show();
            let _ = win.set_focus();
            OPENING_MAIN.store(false, Ordering::SeqCst);
        } else {
            eprintln!("[open_main_window] creating main window...");
            match WebviewWindowBuilder::new(&app_clone, "main", app_url(&app_clone, "index.html"))
                .title("蝶语")
                .inner_size(1120.0, 760.0)
                .min_inner_size(900.0, 600.0)
                .decorations(false)
                .center()
                .visible(true)
                .data_directory(webview_data_dir("main"))
                .build()
            {
                Ok(_) => eprintln!("[open_main_window] main window created"),
                Err(e) => eprintln!("[open_main_window] create main failed: {e}"),
            }
            // 无论创建成功与否都解除切换态（失败时退回登录窗逻辑由后续重登处理）
            OPENING_MAIN.store(false, Ordering::SeqCst);
        }
    });
    Ok(())
}

/// 返回登录窗口。
/// 全部窗口操作放在独立线程：先销毁 main，再创建 login，避免 WebView2 多实例冲突。
#[tauri::command]
fn back_to_login<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    eprintln!("[back_to_login] called");
    let app_clone = app.clone();
    std::thread::spawn(move || {
        // 1. 先销毁主窗
        if let Some(main) = app_clone.get_webview_window("main") {
            if let Err(e) = main.destroy() {
                eprintln!("[back_to_login] destroy main failed: {e}");
            } else {
                eprintln!("[back_to_login] main destroyed");
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(200));

        // 2. 再创建/显示登录窗
        if app_clone.get_webview_window("login").is_none() {
            eprintln!("[back_to_login] creating login window...");
            match WebviewWindowBuilder::new(&app_clone, "login", app_url(&app_clone, "login.html"))
                .title("蝶语")
                .inner_size(340.0, 480.0)
                .resizable(false)
                .maximizable(false)
                .decorations(false)
                .center()
                .visible(true)
                .data_directory(webview_data_dir("login"))
                .build()
            {
                Ok(_) => eprintln!("[back_to_login] login window created"),
                Err(e) => eprintln!("[back_to_login] create login failed: {e}"),
            }
        } else if let Some(login) = app_clone.get_webview_window("login") {
            eprintln!("[back_to_login] login exists, show & focus");
            let _ = login.show();
            let _ = login.set_focus();
        }
    });
    Ok(())
}

/// 打开子窗口（添加好友、发起群聊等）。
#[tauri::command]
fn open_child_window<R: Runtime>(
    app: AppHandle<R>,
    label: String,
    path: String,
    title: String,
    width: f64,
    height: f64,
) -> Result<(), String> {
    let app_clone = app.clone();
    std::thread::spawn(move || {
        // 已存在则聚焦
        if let Some(win) = app_clone.get_webview_window(&label) {
            let _ = win.show();
            let _ = win.set_focus();
            return;
        }
        let data_dir = webview_data_dir(&label);
        let _ = std::fs::create_dir_all(&data_dir);
        match WebviewWindowBuilder::new(&app_clone, &label, app_url(&app_clone, &path))
            .title(&title)
            .inner_size(width, height)
            .min_inner_size(width * 0.8, height * 0.8)
            .max_inner_size(width * 1.2, height * 1.2)
            .resizable(true)
            .maximizable(false)
            .decorations(false)
            .center()
            .visible(true)
            .data_directory(data_dir)
            .build()
        {
            Ok(_) => eprintln!("[open_child_window] {} created", label),
            Err(e) => eprintln!("[open_child_window] create {} failed: {e}", label),
        }
    });
    Ok(())
}

// ========== 系统托盘 ==========

/// 显示并聚焦主窗口；主窗口不存在（未登录）时聚焦登录窗。
fn show_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(win) = app.get_webview_window("main") {
        let _ = win.show();
        let _ = win.unminimize();
        let _ = win.set_focus();
    } else if let Some(login) = app.get_webview_window("login") {
        let _ = login.show();
        let _ = login.set_focus();
    }
}

/// 左键点击托盘：主窗口可见则聚焦，不可见则呼出。
fn toggle_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(win) = app.get_webview_window("main") {
        let visible = win.is_visible().unwrap_or(false);
        if visible {
            // 已在前台时隐藏回托盘；否则呼出
            let focused = win.is_focused().unwrap_or(false);
            if focused {
                let _ = win.hide();
            } else {
                let _ = win.unminimize();
                let _ = win.set_focus();
            }
        } else {
            let _ = win.show();
            let _ = win.unminimize();
            let _ = win.set_focus();
        }
    } else {
        show_main_window(app);
    }
}

/// 更新托盘提示文案为「蝶语 · {状态}」。
fn refresh_tray_tooltip<R: Runtime>(app: &AppHandle<R>) {
    let key: &'static str = *PRESENCE.lock().unwrap();
    let label = PRESENCES
        .iter()
        .find(|(k, _, _)| *k == key)
        .map(|(_, label, _)| *label)
        .unwrap_or("我在线上");
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(&format!("蝶语 · {label}")));
    }
}

/// 构建系统托盘图标与右键菜单（QQ 风格：在线状态子菜单 / 打开蝶语 / 退出蝶语）。
fn build_tray(app: &AppHandle) -> tauri::Result<()> {
    // 在线状态互斥单选
    let mut status_items: Vec<(&'static str, CheckMenuItem<tauri::Wry>)> = Vec::new();
    for (key, label, _) in PRESENCES {
        let item = CheckMenuItem::with_id(
            app,
            format!("presence:{key}"),
            label,
            true,
            key == "online",
            None::<&str>,
        )?;
        status_items.push((key, item));
    }
    let status_menu = Submenu::with_id_and_items(
        app,
        "submenu:presence",
        "在线状态",
        true,
        &status_items
            .iter()
            .map(|(_, i)| i as &dyn tauri::menu::IsMenuItem<tauri::Wry>)
            .collect::<Vec<_>>(),
    )?;

    let open_item = MenuItem::with_id(app, "tray:open", "打开蝶语", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "tray:quit", "退出蝶语", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let sep2 = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[&status_menu, &sep1, &open_item, &sep2, &quit_item],
    )?;

    let icon = app
        .default_window_icon()
        .ok_or_else(|| tauri::Error::AssetNotFound("default window icon".into()))?
        .clone();

    TrayIconBuilder::with_id("main")
        .icon(icon)
        .tooltip("蝶语 · 我在线上")
        .menu(&menu)
        // 右键弹菜单；左键留给「显示/隐藏主窗口」
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            let id = event.id().as_ref();
            match id {
                "tray:open" => show_main_window(app),
                "tray:quit" => {
                    eprintln!("[tray] 用户从托盘退出，放行 ExitRequested");
                    ALLOW_EXIT.store(true, Ordering::SeqCst);
                    app.exit(0);
                }
                other => {
                    if let Some(key) = other.strip_prefix("presence:") {
                        // 映射为 &'static str（event.id() 只在本回调内有效）
                        let static_key: &'static str = PRESENCES
                            .iter()
                            .find(|(k, _, _)| *k == key)
                            .map(|(k, _, _)| *k)
                            .unwrap_or("online");
                        // 更新单选勾选 + 全局状态 + 托盘提示
                        *PRESENCE.lock().unwrap() = static_key;
                        for (k, item) in &status_items {
                            let _ = item.set_checked(*k == static_key);
                        }
                        refresh_tray_tooltip(app);
                        // 通知前端（顶栏状态点 / 后续 WS presence 上报）
                        let _ = app.emit("presence:changed", static_key);
                        eprintln!("[tray] presence -> {static_key}");
                    }
                }
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                toggle_main_window(tray.app_handle());
            }
        })
        .build(app)?;

    Ok(())
}

/// 应用入口（main.rs 调用）。
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .on_window_event(|window, event| {
            // 登录窗被关闭（点 ✕ / destroy）→ 整个应用连同托盘一起退出。
            // 但「登录成功切换到主窗」期间的销毁是正常流程（OPENING_MAIN 守卫），需放行。
            if window.label() == "login" {
                if let tauri::WindowEvent::Destroyed = event {
                    let app = window.app_handle();
                    let switching = OPENING_MAIN.load(Ordering::SeqCst);
                    let has_main = app.get_webview_window("main").is_some();
                    if !switching && !has_main {
                        eprintln!("[window] 登录窗已关闭且无主窗，退出应用（含托盘）");
                        ALLOW_EXIT.store(true, Ordering::SeqCst);
                        app.exit(0);
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            save_secret,
            get_secret,
            delete_secret,
            db_init,
            db_cache_messages,
            db_get_messages,
            db_cached_max_seq,
            win_minimize,
            win_toggle_maximize,
            win_close,
            win_hide,
            open_main_window,
            back_to_login,
            open_child_window,
            debug_log
        ])
        .setup(|app| {
            // 打印并确保应用数据目录存在（tauri-plugin-sql 需要）
            if let Ok(config_dir) = app.path().app_config_dir() {
                eprintln!("[setup] app_config_dir: {:?}", config_dir);
                let _ = std::fs::create_dir_all(&config_dir);
            }
            if let Ok(data_dir) = app.path().app_data_dir() {
                eprintln!("[setup] app_data_dir: {:?}", data_dir);
                let _ = std::fs::create_dir_all(&data_dir);
            }
            // 在 setup 中创建登录窗口（可设置独立 data_directory，避开 WebView2 资源冲突）
            let data_dir = webview_data_dir("login");
            eprintln!("[setup] webview data_directory: {:?}", data_dir);
            WebviewWindowBuilder::new(app, "login", app_url(app.handle(), "login.html"))
                .title("蝶语")
                .inner_size(340.0, 480.0)
                .resizable(false)
                .maximizable(false)
                .decorations(false)
                .center()
                .visible(true)
                .data_directory(data_dir)
                .build()
                .expect("创建登录窗口失败");
            eprintln!("[setup] login window created");

            // 系统托盘（图标驻留任务栏通知区；关闭主窗口只是隐藏）
            build_tray(app.handle()).expect("创建系统托盘失败");
            eprintln!("[setup] system tray created");
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("Iris 应用构建失败")
        .run(|_app, event| {
            // 关闭最后一个窗口时不退出应用（login↔main 切换、主窗口隐藏到托盘都需要驻留）；
            // 仅托盘「退出蝶语」显式放行。
            if let RunEvent::ExitRequested { api, .. } = event {
                if !ALLOW_EXIT.load(Ordering::SeqCst) {
                    api.prevent_exit();
                }
            }
        });
}
