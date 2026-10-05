//! 邮件发送（lettre 0.11 SMTP 客户端，技术文档 5.2.1）。
//!
//! 形式：直连第三方邮箱服务商 SMTP，465 端口隐式 TLS（587 走 STARTTLS 二选一），
//! 不自建邮件服务器。`SMTP_ENABLED=false`（开发默认）时由调用方打印日志、不调用本模块。

use lettre::message::{Mailbox, MultiPart};
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::client::{Tls, TlsParameters};
use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};

use crate::AppState;

/// 发送验证码邮件（HTML + 纯文本双部分）。
///
/// # 参数
/// - `to_email`：收件人（已归一化）；
/// - `code`：6 位数字验证码。
///
/// # 错误
/// 返回错误描述字符串（仅记日志用，不直接透给客户端——避免暴露 SMTP 细节）。
pub async fn send_code_email(state: &AppState, to_email: &str, code: &str) -> Result<(), String> {
    let cfg = &state.cfg;
    // 发件人形如 `Iris <you@qq.com>`；解析失败属配置错误
    let from: Mailbox = cfg
        .smtp_from
        .parse()
        .map_err(|_| format!("SMTP_FROM 配置非法: {}", cfg.smtp_from))?;
    let to: Mailbox = to_email
        .parse()
        .map_err(|_| format!("收件人邮箱非法: {to_email}"))?;

    let plain = format!("你的 Iris 验证码是：{code}\n\n5 分钟内有效。若非本人操作，请忽略本邮件。");
    let html = format!(
        "<div style=\"font-family:sans-serif;max-width:480px\">\
<h2 style=\"color:#5b6ee1\">Iris 邮箱验证码</h2>\
<p>你的验证码是：</p>\
<p style=\"font-size:28px;letter-spacing:6px;font-weight:bold\">{code}</p>\
<p>5 分钟内有效。若非本人操作，请忽略本邮件。</p>\
</div>"
    );

    let email = lettre::Message::builder()
        .from(from)
        .to(to)
        .subject("Iris 邮箱验证码")
        // HTML + 纯文本双部分（alternative_plain_html 为 lettre 提供的便捷构造）
        .multipart(MultiPart::alternative_plain_html(plain, html))
        .map_err(|e| format!("邮件构建失败: {e}"))?;

    // TLS 参数：域名用于 SNI/证书校验
    let tls = TlsParameters::builder(cfg.smtp_host.clone())
        .build()
        .map_err(|e| format!("TLS 参数构建失败: {e}"))?;

    // 465 隐式 TLS（Wrapper）与 587 STARTTLS（Required）二选一
    let mut transport = AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&cfg.smtp_host);
    transport = if cfg.smtp_port == 465 {
        transport.port(465).tls(Tls::Wrapper(tls))
    } else {
        transport.port(cfg.smtp_port).tls(Tls::Required(tls))
    };
    let transport = transport
        .credentials(Credentials::new(
            cfg.smtp_user.clone(),
            cfg.smtp_password.clone(),
        ))
        .build();

    transport
        .send(email)
        .await
        .map(|_| ())
        .map_err(|e| format!("SMTP 发送失败: {e}"))
}
