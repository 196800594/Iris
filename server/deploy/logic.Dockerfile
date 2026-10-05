# im-logic 镜像：多阶段构建（rust:1-slim-bookworm 构建 → debian:bookworm-slim 运行，非 root）
# 纪律：镜像内不烘焙任何秘密、不 COPY .env（.dockerignore 已排除）；迁移已编译进二进制

# ---------- 构建阶段 ----------
# rustup 依据 COPY 进来的 rust-toolchain.toml 自动安装 pinned 版本（1.85.0）
FROM rust:1-slim-bookworm AS build
WORKDIR /build

# 先拷贝清单与工具链文件；Cargo.lock 入库锁定依赖补丁版本
COPY rust-toolchain.toml Cargo.toml Cargo.lock* ./
COPY crates ./crates
COPY migrations ./migrations

# 只构建 im-logic（migrate! 编译期读取 migrations/，故上文必须 COPY）
RUN cargo build --release -p im-logic

# ---------- 运行阶段 ----------
FROM debian:bookworm-slim
# ca-certificates：SMTP/gRPC 走 rustls 用内置根证书，这里补系统证书以备网络诊断工具使用
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --create-home --shell /usr/sbin/nologin iris

COPY --from=build /build/target/release/im-logic /app/im-logic
USER iris
WORKDIR /app

EXPOSE 7200 7201
# 健康检查子命令由 compose healthcheck 调用（/app/im-logic healthcheck）
ENTRYPOINT ["/app/im-logic"]
