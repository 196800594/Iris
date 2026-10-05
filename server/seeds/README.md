# seeds/ 演示种子 SQL 目录

本目录存放**演示用种子数据**（演示账号、示例好友关系、示例群聊）。

纪律（技术文档 5.6 纪律③ / 计划书 W15）：

1. **禁止**把种子 SQL 放进 `../migrations/`——放入后会被 `sqlx::migrate!`
   编译进 im-logic 二进制并在生产启动时自动执行。
2. 本目录文件**永不自动执行**，仅手工导入开发/演示库：
   ```powershell
   # 在 server/ 目录执行（容器名以 docker compose ps 实际输出为准）
   Get-Content .\seeds\20261019_demo_users_seed.sql |
     docker exec -i iris-mysql-1 mysql -uiris -p"$env:MYSQL_PASSWORD" iris
   ```
3. 命名**不得**使用 14 位迁移时间戳前缀格式以外的方式与迁移混淆——
   约定使用 `YYYYMMDD_描述_seed.sql`（如 `20261019_demo_users_seed.sql`），
   保留日期可读性但不落入迁移版本号格式（14 位）。
4. 种子内容只含演示数据；禁止写入真实密码、真实秘密。

W15 打磨演示脚本时补充具体种子文件。
