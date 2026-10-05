#!/usr/bin/env bash
# =====================================================================
# Iris 每日 MySQL 逻辑备份脚本（W15 与 profile=backup 一起落地打磨）
# 调用方：docker compose --profile backup up -d backup（compose 覆盖 command 循环调用）
# 行为：mysqldump --single-transaction（InnoDB 一致性快照，不锁业务表）
#       → gzip 压缩 → /backup/iris_YYYYMMDD_HHMMSS.sql.gz
# 保留：滚动保留最近 14 份，超出自动删除
# 环境：由 compose env_file/depends_on 提供 MYSQL_* 与可达的 mysql 服务
# =====================================================================
set -euo pipefail

# 容器内主机名由 compose environment 指定为 mysql 服务名
HOST="${MYSQL_HOST:-mysql}"
PORT="${MYSQL_PORT:-3306}"
USER_NAME="${MYSQL_USER:-iris}"
PASSWORD="${MYSQL_PASSWORD:?MYSQL_PASSWORD 必须由 compose 注入}"
DATABASE="${MYSQL_DATABASE:-iris}"
KEEP_COUNT="${BACKUP_KEEP_COUNT:-14}"
BACKUP_DIR="${BACKUP_DIR:-/backup}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
TARGET="$BACKUP_DIR/${DATABASE}_${STAMP}.sql.gz"

# 一致性快照导出并压缩（--single-transaction 适合全部 InnoDB 的业务库）
mysqldump -h "$HOST" -P "$PORT" -u "$USER_NAME" -p"$PASSWORD" \
    --single-transaction --routines --triggers "$DATABASE" | gzip > "$TARGET"

# 滚动清理：只保留最近 KEEP_COUNT 份
ls -1t "$BACKUP_DIR/${DATABASE}_"*.sql.gz 2>/dev/null | tail -n +"$((KEEP_COUNT + 1))" | while read -r old; do
    rm -f "$old"
    echo "removed old backup: $old"
done

echo "backup done: $TARGET ($(du -h "$TARGET" | cut -f1))"
