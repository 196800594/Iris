// REST 接口响应类型（与 im-logic 各 handler 的 JSON 输出一一对应；雪花 ID 一律 string 防精度丢失）

/** 当前登录用户资料 GET /users/me */
export interface MeInfo {
  id: string;
  username: string;
  email: string;
  nickname: string;
  avatar_file_id: string | null;
  gender: number;
  signature: string;
}

/** 用户摘要（搜索/好友/成员共用） */
export interface BriefUser {
  id: string;
  username: string;
  nickname: string;
  avatar_file_id: string | null;
  remark?: string;
  online?: boolean;
}

/** 好友列表项 GET /contacts/friends */
export interface Friend extends BriefUser {
  befriend_at: string;
}

/** 好友申请项 GET /contacts/requests */
export interface FriendRequestItem {
  id: string;
  /** 0 待处理 1 已同意 2 已拒绝 */
  status: number;
  greeting: string;
  created_at: string;
  user: BriefUser;
}

/** 会话最后一条消息摘要 */
export interface LastMsg {
  msg_type: number;
  content: string;
  sender_id: string;
  create_time_ms: number;
}

/** 会话列表项 GET /conversations */
export interface Conversation {
  id: string;
  /** 1 单聊 2 群聊 */
  conv_type: 1 | 2;
  unread: number;
  last_msg: LastMsg | null;
  peer?: BriefUser & { remark: string };
  group?: { id: string; name: string; avatar_file_id: string | null };
  updated_ms: number;
}

/** 历史消息 GET /conversations/{id}/messages */
export interface HistoryMsg {
  id: string;
  conv_id: string;
  sender_id: string;
  msg_type: number;
  content: string;
  seq: number;
  client_msg_id: string;
  create_time_ms: number;
}

/** 媒体消息 content JSON（msg_type=2/3） */
export interface MediaContent {
  file_id: string;
  name: string;
  size: number;
  mime: string;
  width?: number;
  height?: number;
}

/** 上传响应 POST /files/upload */
export interface UploadResp {
  file_id: string;
  kind: number;
  name: string;
  size: number;
  mime: string;
  width: number | null;
  height: number | null;
  url: string;
  thumb_url: string | null;
}

/** 签名 URL 换发响应 GET /files/{id}/sign */
export interface SignedUrls {
  file_id: string;
  url: string;
  thumb_url: string | null;
}

/** 群成员 */
export interface GroupMember {
  user_id: string;
  username: string;
  nickname: string;
  avatar_file_id: string | null;
  /** 0 普通 1 群主 2 管理员 */
  role: number;
  joined_at: string;
}

/** 群详情 GET /groups/{id} */
export interface GroupDetail {
  id: string;
  name: string;
  avatar_file_id: string | null;
  announcement: string;
  owner_id: string;
  member_count: number;
  max_members: number;
  members: GroupMember[];
}

/** 入群申请项 GET /groups/applications */
export interface GroupApplicationItem {
  id: string;
  group: { id: string; name: string };
  applicant: { id: string; username: string; nickname: string; avatar_file_id: string | null };
  message: string;
  created_at: string;
}
