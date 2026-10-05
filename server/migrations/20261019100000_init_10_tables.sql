-- =====================================================================
-- 用途：W1 初始化全部 10 张核心表（用户/资料/好友/会话/群/消息/文件）
-- 关联表：users, user_profiles, friend_requests, friendships,
--         conversations, conversation_members, groups, group_applications,
--         messages, files
-- 作者：Iris 开发者
-- 日期：2026-10-19
-- 纪律（技术文档 5.6）：本目录 up-only 只追加；已应用脚本禁止修改；
--   全部表不建物理外键，引用完整性由服务端事务与唯一键保证（计划书 7.3）。
-- =====================================================================

-- 用户账号
CREATE TABLE users (
  id            BIGINT UNSIGNED NOT NULL COMMENT '雪花ID',
  username      VARCHAR(32)  NOT NULL COMMENT '登录名，4-32位字母数字下划线',
  email         VARCHAR(255) NOT NULL COMMENT '邮箱，注册/登录前 trim+小写归一，库内只存小写',
  password_hash VARCHAR(255) NOT NULL COMMENT 'argon2id 哈希',
  status        TINYINT      NOT NULL DEFAULT 0 COMMENT '0正常 1禁用（一期无管理后台，列为 ForceKick 预留）',
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户账号';

-- 用户资料（1:1）
CREATE TABLE user_profiles (
  user_id        BIGINT UNSIGNED NOT NULL,
  nickname       VARCHAR(32)  NOT NULL,
  avatar_file_id BIGINT UNSIGNED NULL,
  gender         TINYINT      NOT NULL DEFAULT 0 COMMENT '0未知 1男 2女',
  signature      VARCHAR(128) NOT NULL DEFAULT '' COMMENT '个性签名',
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户资料';

-- 好友申请（每对人一行，重复申请更新本行）
CREATE TABLE friend_requests (
  id           BIGINT UNSIGNED NOT NULL,
  requester_id BIGINT UNSIGNED NOT NULL COMMENT '申请人',
  addressee_id BIGINT UNSIGNED NOT NULL COMMENT '接收人',
  greeting     VARCHAR(64) NOT NULL DEFAULT '' COMMENT '打招呼',
  status       TINYINT NOT NULL DEFAULT 0 COMMENT '0待处理 1已同意 2已拒绝',
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  handled_at   DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_friend_request_pair (requester_id, addressee_id),
  KEY idx_fr_addressee_status (addressee_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='好友申请';

-- 好友关系（同意时插入两行；一期物理删除）
CREATE TABLE friendships (
  id         BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL COMMENT '本人',
  friend_id  BIGINT UNSIGNED NOT NULL COMMENT '好友',
  remark     VARCHAR(32) NOT NULL DEFAULT '' COMMENT '好友备注',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_friendship_pair (user_id, friend_id),
  KEY idx_friendship_friend (friend_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='好友关系';

-- 会话（单聊、群聊统一）
-- dialog_key：单聊二人确定性键（min(uid)_max(uid)），uk 唯一约束防止并发重建会话；
-- MySQL 唯一索引允许多个 NULL，群聊行不受影响
CREATE TABLE conversations (
  id          BIGINT UNSIGNED NOT NULL COMMENT '雪花ID',
  type        TINYINT NOT NULL COMMENT '1单聊 2群聊',
  dialog_key  VARCHAR(48) NULL COMMENT '单聊二人确定性键：min(uid)_max(uid)，防并发重建；群聊为 NULL',
  group_id    BIGINT UNSIGNED NULL COMMENT 'type=2 时关联 groups.id',
  last_seq    BIGINT NOT NULL DEFAULT 0 COMMENT '会话内最新序号',
  last_msg_id BIGINT UNSIGNED NULL,
  created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_conv_dialog (dialog_key),
  KEY idx_conv_group (group_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话';

-- 会话成员（单聊恰 2 行；群聊 N 行）
CREATE TABLE conversation_members (
  conv_id   BIGINT UNSIGNED NOT NULL,
  user_id   BIGINT UNSIGNED NOT NULL,
  role      TINYINT NOT NULL DEFAULT 0 COMMENT '0普通成员 1群主 2管理员',
  read_seq  BIGINT NOT NULL DEFAULT 0 COMMENT '已读水位',
  join_seq  BIGINT NOT NULL DEFAULT 0 COMMENT '加入时会话 seq 基线（群聊入群前消息不可见）',
  muted     TINYINT NOT NULL DEFAULT 0 COMMENT '0否 1是（禁言二期，一期保留列）',
  joined_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (conv_id, user_id),
  KEY idx_cm_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='会话成员';

-- 群
CREATE TABLE groups (
  id            BIGINT UNSIGNED NOT NULL,
  conv_id       BIGINT UNSIGNED NOT NULL COMMENT '对应会话',
  name          VARCHAR(64) NOT NULL,
  avatar_file_id BIGINT UNSIGNED NULL,
  owner_id      BIGINT UNSIGNED NOT NULL,
  announcement  VARCHAR(500) NOT NULL DEFAULT '',
  member_count  INT NOT NULL DEFAULT 0 COMMENT '由业务事务维护，不做运行时 COUNT(*)',
  max_members   INT NOT NULL DEFAULT 200 COMMENT '一期上限 200',
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_group_owner (owner_id),
  KEY idx_group_conv (conv_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='群';

-- 入群申请/邀请（每群每人唯一一行；再次申请/邀请更新本行并重置 status，邀请留痕）
CREATE TABLE group_applications (
  id           BIGINT UNSIGNED NOT NULL,
  group_id     BIGINT UNSIGNED NOT NULL,
  applicant_id BIGINT UNSIGNED NOT NULL,
  inviter_id   BIGINT UNSIGNED NULL COMMENT '邀请人；NULL 表示主动申请',
  message      VARCHAR(64) NOT NULL DEFAULT '',
  status       TINYINT NOT NULL DEFAULT 0 COMMENT '0待处理 1已同意 2已拒绝 3已忽略',
  handled_by   BIGINT UNSIGNED NULL,
  created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  handled_at   DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ga_group_applicant (group_id, applicant_id),
  KEY idx_ga_group_status (group_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='入群申请';

-- 消息（核心表）
-- uk_msg_conv_client：client_msg_id 幂等的永久防线（Redis 窗口过期后撞键回查原 ack，计划书 6.2）
CREATE TABLE messages (
  id            BIGINT UNSIGNED NOT NULL COMMENT '雪花ID（全局）',
  conv_id       BIGINT UNSIGNED NOT NULL,
  sender_id     BIGINT UNSIGNED NOT NULL,
  msg_type      TINYINT NOT NULL COMMENT '0文本 1图片 2文件 3系统',
  content       MEDIUMTEXT NOT NULL COMMENT '文本原文或媒体 JSON 引用',
  seq           BIGINT NOT NULL COMMENT '会话内单调序号',
  client_msg_id CHAR(36) NOT NULL COMMENT '客户端 UUID，幂等键',
  status        TINYINT NOT NULL DEFAULT 0 COMMENT '0正常 1撤回（二期）',
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_msg_conv_seq (conv_id, seq),
  UNIQUE KEY uk_msg_conv_client (conv_id, client_msg_id),
  KEY idx_msg_sender (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息';

-- 文件元数据
CREATE TABLE files (
  id            BIGINT UNSIGNED NOT NULL,
  uploader_id   BIGINT UNSIGNED NOT NULL,
  kind          TINYINT NOT NULL COMMENT '1图片 2普通文件 3头像',
  original_name VARCHAR(255) NOT NULL,
  storage_path  VARCHAR(512) NOT NULL COMMENT '相对 STORAGE_ROOT 的路径',
  thumb_path    VARCHAR(512) NULL COMMENT '缩略图路径',
  mime          VARCHAR(128) NOT NULL DEFAULT '',
  size          BIGINT NOT NULL,
  width         INT NULL,
  height        INT NULL,
  sha256        CHAR(64) NULL COMMENT '内容哈希，为去重预留',
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_files_uploader (uploader_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件元数据';
