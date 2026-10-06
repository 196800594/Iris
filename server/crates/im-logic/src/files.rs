//! files 模块 —— 图片/文件 HTTP 上传与签名下载（计划书 6.7 / 技术文档 5.1 第 10 条）。
//!
//! 设计要点：
//! - 上传：`POST /api/v1/files/upload`（multipart/form-data，Bearer access）；
//!   字段 `file` 为文件本体，字段 `kind` 可选（`image`/`file`/`avatar`，缺省按 MIME 自动判别）。
//! - 图片（kind=1）与头像（kind=3）经 `image` crate 解码取宽高并生成 **宽 200px 的 JPEG 缩略图**；
//!   普通文件（kind=2）不做解码。
//! - 存储路径与原始文件名无关：`{STORAGE_ROOT}/yyyy/mm/dd/{雪花ID}.{规范化扩展名}`，
//!   缩略图为同目录 `{雪花ID}_thumb.jpg`，防路径穿越（`files.storage_path` 只含服务端生成的相对路径）。
//! - 下载：`GET /api/v1/files/{id}?expires=&sig=[&thumb=1]`，query 签名鉴权（便于 `<img>` 直接使用）；
//!   `sig = HMAC-SHA256(SIGNED_URL_SECRET, "{file_id}.{expires}")`（小写 hex），
//!   默认 5 分钟有效（`SIGNED_URL_TTL_SECONDS`）。
//! - 历史消息渲染：`GET /api/v1/files/{id}/sign`（Bearer）按 file_id 换发一对新的短期签名 URL。
//!
//! 演进（二期）：[`Storage`] trait 新增 Oss/S3 实现后业务代码不变（计划书 6.7）；
//! 断点续传二期实现，本期整文件一次上传。

use std::io::Cursor;
use std::path::{Component, Path, PathBuf};
use std::sync::Arc;

use axum::extract::{DefaultBodyLimit, Multipart, Path as AxumPath, Query, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use hmac::{Hmac, Mac};
use serde::Deserialize;
use serde_json::json;
use sha2::{Digest, Sha256};

use crate::middleware::AuthUser;
use crate::AppState;
use im_common::error::{ApiResult, AppError};

/// HMAC-SHA256 类型别名（下载 URL 签名，计划书 6.7）。
type HmacSha256 = Hmac<Sha256>;

/// files 表 kind 列：1 图片。
const KIND_IMAGE: i8 = 1;
/// files 表 kind 列：2 普通文件。
const KIND_FILE: i8 = 2;
/// files 表 kind 列：3 头像。
const KIND_AVATAR: i8 = 3;

/// 缩略图最长边约束：宽度 200px（技术文档 5.1 第 10 条；高度按比例，封顶 6400px 防御异常图）。
const THUMB_WIDTH: u32 = 200;
/// 缩略图 JPEG 高度上限（与宽度配合约束缩放比）。
const THUMB_HEIGHT_MAX: u32 = 6400;
/// multipart 边界等表单开销预留：body 限制 = 文件上限 + 1MiB。
pub(crate) const MULTIPART_HEADROOM: usize = 1024 * 1024;

// ---------------------------------------------------------------------------
// Storage 抽象（一期 LocalFs；二期 Oss/S3 实现同一 trait）
// ---------------------------------------------------------------------------

/// 文件存储抽象：业务代码只依赖本 trait，二期新增对象存储实现时处理器不变（计划书 6.7）。
///
/// 所有方法以相对 `root` 的 POSIX 风格相对路径（`yyyy/mm/dd/xxx.ext`）寻址，
/// 实现方必须拒绝绝对路径与 `..` 父目录组件。
pub trait Storage: Send + Sync {
    /// 写入整个文件（父目录不存在时自动创建）。
    async fn put(&self, rel_path: &str, data: &[u8]) -> std::io::Result<()>;

    /// 读取整个文件。
    async fn get(&self, rel_path: &str) -> std::io::Result<Vec<u8>>;
}

/// 本地文件系统存储（一期唯一实现，根目录由 `STORAGE_ROOT` 指定）。
pub struct LocalFs {
    /// 存储根目录（容器内 `/data/uploads`；本机开发默认 `./data/uploads`）
    root: PathBuf,
}

impl LocalFs {
    /// 构造存储实例并确保根目录存在（启动期调用；目录不可建则 fail-fast）。
    pub fn new(root: impl Into<PathBuf>) -> Self {
        let root = root.into();
        std::fs::create_dir_all(&root).expect("STORAGE_ROOT 目录创建失败");
        Self { root }
    }

    /// 把相对路径安全拼接到根目录下：只允许普通组件，拒绝绝对路径/盘符/`..`。
    ///
    /// 返回 `None` 表示相对路径含非法组件（路径穿越攻击或脏数据）。
    fn resolve(&self, rel_path: &str) -> Option<PathBuf> {
        let mut full = self.root.clone();
        for comp in Path::new(rel_path).components() {
            match comp {
                Component::Normal(seg) => full.push(seg),
                // RootDir/Prefix（Windows 盘符）/CurDir/ParentDir 一律拒绝
                _ => return None,
            }
        }
        Some(full)
    }
}

impl Storage for LocalFs {
    async fn put(&self, rel_path: &str, data: &[u8]) -> std::io::Result<()> {
        let full = self
            .resolve(rel_path)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "非法存储路径"))?;
        if let Some(parent) = full.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }
        tokio::fs::write(full, data).await
    }

    async fn get(&self, rel_path: &str) -> std::io::Result<Vec<u8>> {
        let full = self
            .resolve(rel_path)
            .ok_or_else(|| std::io::Error::new(std::io::ErrorKind::InvalidInput, "非法存储路径"))?;
        tokio::fs::read(full).await
    }
}

// ---------------------------------------------------------------------------
// 路由
// ---------------------------------------------------------------------------

/// files 路由集合；`upload_limit` 为 multipart body 上限（文件上限 + 表单开销）。
pub fn router(upload_limit: usize) -> Router<Arc<AppState>> {
    Router::new()
        .route("/files/upload", post(upload))
        .route("/files/{id}", get(download))
        .route("/files/{id}/sign", get(sign))
        // 上传需放开 axum 默认 2MiB body 限制（在网关只拦 WS 帧，REST 走本层限制）
        .layer(DefaultBodyLimit::max(upload_limit))
}

// ---------------------------------------------------------------------------
// 上传
// ---------------------------------------------------------------------------

/// 上传处理结果（内存中暂存的文件与元数据）。
struct UploadedPart {
    /// 原始文件名（已截取 base name，防路径穿越）
    filename: String,
    /// 客户端声明/扩展名推断出的 MIME
    declared_mime: Option<String>,
    /// 文件字节
    data: Vec<u8>,
}

/// `POST /files/upload`（计划书 6.7 时序图）。
///
/// 多部分表单：`file`（必填，文件本体）+ `kind`（可选：image/file/avatar）。
async fn upload(
    State(state): State<Arc<AppState>>,
    AuthUser { uid }: AuthUser,
    mut multipart: Multipart,
) -> ApiResult<Json<serde_json::Value>> {
    let mut part: Option<UploadedPart> = None;
    let mut kind_hint: Option<String> = None;

    // 逐字段读取（file 字段按类型上限分块计数，超限在读取阶段即拒绝，避免整文件入内存）
    while let Some(field) = multipart
        .next_field()
        .await
        .map_err(|_| AppError::bad_request("multipart 表单解析失败"))?
    {
        let name = field.name().unwrap_or_default().to_string();
        match name.as_str() {
            "kind" => {
                kind_hint = Some(
                    field
                        .text()
                        .await
                        .map_err(|_| AppError::bad_request("kind 字段读取失败"))?
                        .trim()
                        .to_ascii_lowercase(),
                );
            }
            "file" => {
                let filename = sanitize_filename(field.file_name().unwrap_or("unnamed"));
                let declared_mime = field
                    .content_type()
                    .map(str::to_string)
                    .filter(|m| !m.is_empty());

                // MIME 尚未知，先按两档中较大的文件上限读取；类型确认后再做精确大小校验
                let data = read_capped(field, state.cfg.file_max_bytes).await?;
                part = Some(UploadedPart {
                    filename,
                    declared_mime,
                    data,
                });
            }
            _ => {
                // 未知字段忽略（不报错，保持表单前向兼容）
            }
        }
    }

    let part = part.ok_or_else(|| AppError::bad_request("缺少 file 字段"))?;

    // 类型判别：扩展名/MIME → (是否图片, 规范化扩展名, 有效 MIME)
    let (is_image, ext, effective_mime) = classify(&part.filename, part.declared_mime.as_deref())?;
    // kind 字段与 MIME 一致性校验，缺省按 MIME 自动判别
    let kind = match kind_hint.as_deref() {
        Some("avatar") if is_image => KIND_AVATAR,
        Some("image") if is_image => KIND_IMAGE,
        Some("file") if !is_image => KIND_FILE,
        Some("avatar") | Some("image") => {
            return Err(AppError::file_type_unsupported());
        }
        Some("file") => return Err(AppError::file_type_unsupported()),
        Some(other) => return Err(AppError::bad_request(format!("未知 kind: {other}"))),
        None => {
            if is_image {
                KIND_IMAGE
            } else {
                KIND_FILE
            }
        }
    };

    // 精确大小上限：图片（含头像）≤ IMAGE_MAX_BYTES，其他 ≤ FILE_MAX_BYTES
    let limit = if is_image {
        state.cfg.image_max_bytes
    } else {
        state.cfg.file_max_bytes
    };
    if part.data.len() > limit {
        return Err(AppError::file_too_large());
    }

    // 图片解码：取宽高 + 生成 200px 宽 JPEG 缩略图；解码失败按"类型不允许"拒绝
    let (width, height, thumb_bytes): (Option<i32>, Option<i32>, Option<Vec<u8>>) = if is_image {
        let img = image::load_from_memory(&part.data)
            .map_err(|_| AppError::file_type_unsupported())?;
        let thumb = make_thumbnail_jpeg(&img)?;
        (
            Some(img.width() as i32),
            Some(img.height() as i32),
            Some(thumb),
        )
    } else {
        (None, None, None)
    };

    // 内容哈希（files.sha256 列，为二期去重预留）
    let sha256 = hex::encode(Sha256::digest(&part.data));

    // 服务端生成存储路径：yyyy/mm/dd/{雪花ID}.{ext}（与原始文件名无关）
    let file_id = im_common::id::next_id();
    let date_dir = chrono::Local::now().format("%Y/%m/%d").to_string();
    let storage_rel = format!("{date_dir}/{file_id}.{ext}");
    let thumb_rel = thumb_bytes
        .as_ref()
        .map(|_| format!("{date_dir}/{file_id}_thumb.jpg"));

    // 先落盘（失败直接 5000，不写脏元数据）
    state
        .storage
        .put(&storage_rel, &part.data)
        .await
        .map_err(|e| {
            tracing::error!(file_id, error = %e, "文件写入失败");
            AppError::internal()
        })?;
    if let (Some(thumb), Some(thumb_rel)) = (thumb_bytes.as_ref(), thumb_rel.as_ref()) {
        state.storage.put(thumb_rel, thumb).await.map_err(|e| {
            tracing::error!(file_id, error = %e, "缩略图写入失败");
            AppError::internal()
        })?;
    }

    // 元数据入库
    sqlx::query(
        "INSERT INTO files \
         (id, uploader_id, kind, original_name, storage_path, thumb_path, mime, size, width, height, sha256) \
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(file_id)
    .bind(uid)
    .bind(kind)
    .bind(part.filename.clone())
    .bind(&storage_rel)
    .bind(&thumb_rel)
    .bind(&effective_mime)
    .bind(part.data.len() as u64)
    .bind(width)
    .bind(height)
    .bind(&sha256)
    .execute(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!(file_id, error = %e, "files 元数据写入失败");
        AppError::internal()
    })?;

    // 拼签名访问 URL（5 分钟有效；PUBLIC_BASE_URL 为空时返回相对路径）
    let (url, thumb_url) = signed_urls(&state.cfg, file_id, thumb_rel.is_some());

    tracing::info!(file_id, uid, kind, size = part.data.len(), "文件上传成功");

    Ok(Json(json!({
        "file_id": file_id.to_string(),
        "kind": kind,
        "name": part.filename,
        "size": part.data.len(),
        "mime": effective_mime,
        "width": width,
        "height": height,
        "url": url,
        "thumb_url": thumb_url,
    })))
}

/// 分块读取 multipart 字段，累计超过 `max_bytes` 立即返回 4002（避免超限大文件撑爆内存）。
async fn read_capped(
    mut field: axum::extract::multipart::Field<'_>,
    max_bytes: usize,
) -> ApiResult<Vec<u8>> {
    let mut buf = Vec::new();
    while let Some(chunk) = field
        .chunk()
        .await
        .map_err(|_| AppError::bad_request("文件内容读取失败"))?
    {
        if buf.len() + chunk.len() > max_bytes {
            return Err(AppError::file_too_large());
        }
        buf.extend_from_slice(&chunk);
    }
    if buf.is_empty() {
        return Err(AppError::bad_request("上传文件不能为空"));
    }
    Ok(buf)
}

/// 原始文件名清洗：只取最后一段 base name，去控制字符，截断到 200 字符（DB 列 255 留余量）。
fn sanitize_filename(raw: &str) -> String {
    let base = raw
        .replace('\\', "/")
        .split('/')
        .next_back()
        .unwrap_or("unnamed")
        .chars()
        .filter(|c| !c.is_control())
        .collect::<String>();
    let base = base.trim();
    if base.is_empty() {
        return "unnamed".to_string();
    }
    base.chars().take(200).collect()
}

/// MIME/扩展名白名单判别：返回 `(是否图片, 规范化扩展名, 有效 MIME)`。
///
/// 规则：
/// - 优先信客户端声明的 MIME；声明缺失或为 `application/octet-stream` 时按扩展名推断；
/// - 扩展名一律采用服务端按 MIME 规范化的结果（不信客户端给的后缀，防 `.exe` 伪装）；
/// - 图片：jpeg/png/gif/webp/bmp；文件：pdf/zip/txt/Office 新旧格式（白名单见各常量表）。
fn classify(filename: &str, declared_mime: Option<&str>) -> ApiResult<(bool, String, String)> {
    // 客户端原始扩展名（仅在 MIME 缺失/泛型时用于推断；ascii、长度 ≤8）
    let ext_from_name: Option<String> = filename
        .rsplit('.')
        .next()
        .filter(|e| {
            !e.is_empty()
                && e.len() <= 8
                && e.chars().all(|c| c.is_ascii_alphanumeric())
        })
        .map(str::to_ascii_lowercase);

    // 优先信声明的 MIME；缺失/泛型 octet-stream 时按扩展名兜底推断
    let mime: &str = declared_mime
        .filter(|m| !m.is_empty() && *m != "application/octet-stream")
        .or_else(|| ext_from_name.as_deref().and_then(mime_from_ext))
        .ok_or_else(AppError::file_type_unsupported)?;

    if IMAGE_MIMES.contains(&mime) {
        let ext = ext_for_mime(mime).to_string();
        return Ok((true, ext, mime.to_string()));
    }
    if FILE_MIMES.contains(&mime) {
        let ext = ext_for_mime(mime).to_string();
        return Ok((false, ext, mime.to_string()));
    }
    Err(AppError::file_type_unsupported())
}

/// 允许的图片 MIME（与 workspace image crate features 对齐：jpeg/png/gif/webp/bmp）。
const IMAGE_MIMES: &[&str] = &[
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
];

/// 允许的普通文件 MIME（毕设演示白名单：PDF/ZIP/纯文本/Office 新旧格式）。
const FILE_MIMES: &[&str] = &[
    "application/pdf",
    "application/zip",
    "application/x-zip-compressed",
    "text/plain",
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

/// MIME → 规范化扩展名（白名单内一一映射）。
fn ext_for_mime(mime: &str) -> &'static str {
    match mime {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        "image/gif" => "gif",
        "image/webp" => "webp",
        "image/bmp" => "bmp",
        "application/pdf" => "pdf",
        "application/zip" | "application/x-zip-compressed" => "zip",
        "text/plain" => "txt",
        "application/msword" => "doc",
        "application/vnd.ms-excel" => "xls",
        "application/vnd.ms-powerpoint" => "ppt",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => "docx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" => "xlsx",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation" => "pptx",
        _ => "bin",
    }
}

/// 扩展名 → MIME（仅在客户端未声明 MIME 时兜底推断）。
fn mime_from_ext(ext: &str) -> Option<&'static str> {
    Some(match ext {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "bmp" => "image/bmp",
        "pdf" => "application/pdf",
        "zip" => "application/zip",
        "txt" => "text/plain",
        "doc" => "application/msword",
        "xls" => "application/vnd.ms-excel",
        "ppt" => "application/vnd.ms-powerpoint",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        _ => return None,
    })
}

/// 生成宽 200px 的 JPEG 缩略图（质量 85；透明通道 flatten 到白底；动图只取首帧）。
fn make_thumbnail_jpeg(img: &image::DynamicImage) -> ApiResult<Vec<u8>> {
    let thumb = img.thumbnail(THUMB_WIDTH, THUMB_HEIGHT_MAX);
    // JPEG 无透明通道：统一转 RGB（透明区域置白）
    let rgb = thumb.to_rgb8();
    let mut out = Cursor::new(Vec::new());
    image::codecs::jpeg::JpegEncoder::new_with_quality(&mut out, 85)
        .encode_image(&image::DynamicImage::ImageRgb8(rgb))
        .map_err(|e| {
            tracing::error!(error = %e, "缩略图编码失败");
            AppError::internal()
        })?;
    Ok(out.into_inner())
}

// ---------------------------------------------------------------------------
// 签名 URL
// ---------------------------------------------------------------------------

/// 计算下载签名：小写 hex(HMAC-SHA256(secret, "{file_id}.{expires}"))（计划书 6.7）。
fn sign_file(secret: &str, file_id: u64, expires: i64) -> String {
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes()).expect("HMAC 接受任意长度密钥");
    mac.update(format!("{file_id}.{expires}").as_bytes());
    hex::encode(mac.finalize().into_bytes())
}

/// 校验签名与时间窗；任一不符返回 4003。
fn verify_signature(secret: &str, file_id: u64, expires: i64, sig: &str, now: i64) -> bool {
    if now > expires {
        return false;
    }
    let expected = sign_file(secret, file_id, expires);
    // 等长比较，降低计时侧信道（签名本身低敏感，保持严谨）
    let Ok(provided) = hex::decode(sig) else {
        return false;
    };
    let Ok(expected_bytes) = hex::decode(expected) else {
        return false;
    };
    expected_bytes
        .iter()
        .zip(provided.iter())
        .fold(provided.len() == expected_bytes.len(), |acc, (a, b)| acc && a == b)
}

/// 生成一对（原图、缩略图）签名 URL；无缩略图时 `thumb_url` 为 null。
fn signed_urls(cfg: &im_common::config::Config, file_id: u64, has_thumb: bool) -> (String, Option<String>) {
    let expires = chrono::Utc::now().timestamp() + cfg.signed_url_ttl_seconds as i64;
    let sig = sign_file(&cfg.signed_url_secret, file_id, expires);
    let base = cfg.public_base_url.trim_end_matches('/');
    let url = format!("{base}/api/v1/files/{file_id}?expires={expires}&sig={sig}");
    let thumb_url = has_thumb.then(|| format!("{url}&thumb=1"));
    (url, thumb_url)
}

/// `GET /files/{id}/sign`（Bearer）：按 file_id 换发新的短期签名 URL（历史消息渲染用）。
///
/// 一期不做会话级可见性校验：签名 URL 本身即 5 分钟能力令牌（计划书 6.7），
/// 仅登录用户可取；file_id 为雪花 ID 不可枚举。
async fn sign(
    State(state): State<Arc<AppState>>,
    AuthUser { .. }: AuthUser,
    AxumPath(id): AxumPath<u64>,
) -> ApiResult<Json<serde_json::Value>> {
    let thumb_path: Option<String> = sqlx::query_scalar(
        "SELECT thumb_path FROM files WHERE id = ? LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!(file_id = id, error = %e, "查询文件元数据失败");
        AppError::internal()
    })?
    .flatten()
    .ok_or_else(|| AppError::not_found("文件不存在"))?;

    let (url, thumb_url) = signed_urls(&state.cfg, id, thumb_path.is_some());
    Ok(Json(json!({ "file_id": id.to_string(), "url": url, "thumb_url": thumb_url })))
}

// ---------------------------------------------------------------------------
// 下载
// ---------------------------------------------------------------------------

/// `GET /files/{id}` 的 query 参数（计划书 6.7：expires + sig；thumb=1 取缩略图）。
#[derive(Deserialize)]
struct DownloadQuery {
    /// Unix 过期时间戳（秒）
    expires: i64,
    /// HMAC-SHA256 签名（小写 hex）
    sig: String,
    /// 非空/1 时下载缩略图（无缩略图则回退原图）
    #[serde(default)]
    thumb: Option<String>,
}

/// `GET /files/{id}?expires=&sig=[&thumb=1]`（query 签名鉴权，便于 `<img>` 引用）。
async fn download(
    State(state): State<Arc<AppState>>,
    AxumPath(id): AxumPath<u64>,
    Query(q): Query<DownloadQuery>,
) -> ApiResult<Response> {
    let now = chrono::Utc::now().timestamp();
    if !verify_signature(&state.cfg.signed_url_secret, id, q.expires, &q.sig, now) {
        return Err(AppError::bad_signature());
    }

    // 取存储元数据（storage_path / thumb_path / 原始名 / MIME）
    let row: Option<(String, Option<String>, String, String)> = sqlx::query_as(
        "SELECT storage_path, thumb_path, original_name, mime FROM files WHERE id = ? LIMIT 1",
    )
    .bind(id)
    .fetch_optional(&state.pool)
    .await
    .map_err(|e| {
        tracing::error!(file_id = id, error = %e, "查询文件元数据失败");
        AppError::internal()
    })?;
    let Some((storage_path, thumb_path, original_name, mime)) = row else {
        return Err(AppError::not_found("文件不存在"));
    };

    // thumb=1 且确有缩略图时取缩略图（统一以 image/jpeg 输出）；否则原图
    let want_thumb = q.thumb.as_deref().is_some_and(|v| v == "1" || !v.is_empty());
    let (rel_path, out_mime, is_image) = if want_thumb {
        match thumb_path {
            Some(t) => (t, "image/jpeg".to_string(), true),
            None => (storage_path, mime.clone(), mime.starts_with("image/")),
        }
    } else {
        let img = mime.starts_with("image/");
        (storage_path, mime.clone(), img)
    };

    let data = state.storage.get(&rel_path).await.map_err(|e| {
        tracing::error!(file_id = id, path = %rel_path, error = %e, "文件读取失败");
        match e.kind() {
            std::io::ErrorKind::NotFound | std::io::ErrorKind::InvalidInput => {
                AppError::not_found("文件不存在")
            }
            _ => AppError::internal(),
        }
    })?;

    // 输出头：图片 inline 直接渲染；其他文件 attachment 触发下载（中文文件名 RFC 5987）
    let mut headers = HeaderMap::new();
    let safe_mime = HeaderValue::from_str(&out_mime)
        .unwrap_or(HeaderValue::from_static("application/octet-stream"));
    headers.insert(header::CONTENT_TYPE, safe_mime);
    let disposition = if is_image {
        "inline".to_string()
    } else {
        content_disposition_attachment(&original_name)
    };
    if let Ok(v) = HeaderValue::from_str(&disposition) {
        headers.insert(header::CONTENT_DISPOSITION, v);
    }

    Ok((StatusCode::OK, headers, data).into_response())
}

/// 构造 attachment 的 Content-Disposition：ASCII 回退名 + `filename*=UTF-8''` 编码名。
fn content_disposition_attachment(name: &str) -> String {
    let ascii_fallback: String = name
        .chars()
        .map(|c| {
            if c.is_ascii_graphic() && c != '"' && c != '\\' {
                c
            } else {
                '_'
            }
        })
        .take(128)
        .collect();
    let mut encoded = String::new();
    for b in name.trim().as_bytes() {
        match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(*b as char)
            }
            _ => encoded.push_str(&format!("%{:02X}", b)),
        }
    }
    format!("attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{encoded}")
}
