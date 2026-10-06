//! 雪花 ID 请求体兼容反序列化。
//!
//! 背景：雪花 ID 为 uint64（最大 2^63-1），超过 JavaScript Number 的安全整数
//! 上限（2^53-1）。桌面端/浏览器端约定 ID 一律以字符串承载，因此请求体中的
//! u64 字段允许是 JSON 数字或数字字符串，两种形态都能正确解析。
//!
//! 仅用于 JSON 请求体（axum Json 提取器），路径参数走 axum 原生字符串解析，无需处理。

use serde::{Deserialize, Deserializer};

/// 解析单个 JSON 值为 u64：支持无符号/有符号数字与纯数字字符串。
fn parse_u64(v: serde_json::Value) -> Result<u64, serde_json::Error> {
    match v {
        serde_json::Value::Number(n) => {
            n.as_u64().ok_or_else(|| serde::de::Error::custom("无效的 ID 数值"))
        }
        serde_json::Value::String(s) => s
            .trim()
            .parse::<u64>()
            .map_err(serde::de::Error::custom),
        _ => Err(serde::de::Error::custom("ID 必须为数字或数字字符串")),
    }
}

/// `#[serde(deserialize_with = ...)]`：必选 u64 字段。
pub fn de_u64<'de, D>(deserializer: D) -> Result<u64, D::Error>
where
    D: Deserializer<'de>,
{
    parse_u64(serde_json::Value::deserialize(deserializer)?).map_err(serde::de::Error::custom)
}

/// `#[serde(deserialize_with = ...)]`：可选 u64 字段（字段缺省/ null 均为 None）。
pub fn de_u64_opt<'de, D>(deserializer: D) -> Result<Option<u64>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<serde_json::Value>::deserialize(deserializer)?
        .map(parse_u64)
        .transpose()
        .map_err(serde::de::Error::custom)
}

/// `#[serde(deserialize_with = ..., default)]`：u64 列表，元素支持数字或字符串。
pub fn de_u64_vec<'de, D>(deserializer: D) -> Result<Vec<u64>, D::Error>
where
    D: Deserializer<'de>,
{
    let values = Vec::<serde_json::Value>::deserialize(deserializer)?;
    values
        .into_iter()
        .map(parse_u64)
        .collect::<Result<Vec<_>, _>>()
        .map_err(serde::de::Error::custom)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[derive(serde::Deserialize)]
    struct Scalar {
        #[serde(deserialize_with = "de_u64")]
        uid: u64,
        #[serde(default, deserialize_with = "de_u64_opt")]
        avatar: Option<u64>,
    }

    #[derive(serde::Deserialize)]
    struct List {
        #[serde(default, deserialize_with = "de_u64_vec")]
        ids: Vec<u64>,
    }

    #[test]
    fn 数字与字符串均可解析() {
        let n: Scalar = serde_json::from_str(r#"{"uid":640482213623759077,"avatar":123}"#).unwrap();
        assert_eq!(n.uid, 640482213623759077);
        assert_eq!(n.avatar, Some(123));

        let s: Scalar =
            serde_json::from_str(r#"{"uid":"640482213623759077","avatar":"0"}"#).unwrap();
        assert_eq!(s.uid, 640482213623759077);
        assert_eq!(s.avatar, Some(0));

        let d: Scalar = serde_json::from_str(r#"{"uid":"1"}"#).unwrap();
        assert_eq!(d.avatar, None);
    }

    #[test]
    fn 列表混合形态() {
        let l: List =
            serde_json::from_str(r#"{"ids":[1,"2",640482354585927909,"640482213623759077"]}"#)
                .unwrap();
        assert_eq!(l.ids, vec![1, 2, 640482354585927909, 640482213623759077]);

        let empty: List = serde_json::from_str("{}").unwrap();
        assert!(empty.ids.is_empty());
    }

    #[test]
    fn 非法值被拒() {
        assert!(serde_json::from_str::<Scalar>(r#"{"uid":"abc"}"#).is_err());
        assert!(serde_json::from_str::<Scalar>(r#"{"uid":true}"#).is_err());
        assert!(serde_json::from_str::<List>(r#"{"ids":[1,"x"]}"#).is_err());
    }
}
