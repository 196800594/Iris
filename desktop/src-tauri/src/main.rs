// Windows 发布构建隐藏控制台窗口（debug 保留，便于排错）
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    iris_desktop_lib::run();
}
