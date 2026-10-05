# im-gateway 镜像：多阶段构建（rust:1-slim-bookworm 构建 → debian:bookworm-slim 运行，非 root）
# 纪律：镜像内不烘焙任何秘密、不 COPY .env（.dockerignore 已排除）

# ---------- 构建阶段 ----------
FROM rust:1-slim-bookworm AS build
WORKDIR /build

COPY rust-toolchain.toml Cargo.toml Cargo.lock* ./
COPY crates ./crates
COPY migrations ./migrations

RUN cargo build --release -p im-gateway

# ---------- 运行阶段 ----------
FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --create-home --shell /usr/sbin/nologin iris

COPY --from=build /build/target/release/im-gateway /app/im-gateway
USER iris
WORKDIR /app

EXPOSE 7100
# 健康检查子命令由 compose healthcheck 调用（/app/im-gateway healthcheck）
ENTRYPOINT ["/app/im-gateway"]
