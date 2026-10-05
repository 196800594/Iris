//! 构建脚本：编译 `proto/iris.proto` 生成 Rust 代码。
//! 使用 protoc-bin-vendored 自带 protoc，开发机无需单独安装 protoc
//! （技术文档 3.1 构建依赖说明）。

use std::path::PathBuf;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 让 protoc 可执行文件指向 vendored 版本（跨平台免安装；edition 2021 下 set_var 为安全操作）
    let protoc = protoc_bin_vendored::protoc_bin_path()?;
    std::env::set_var("PROTOC", protoc);

    let proto_dir = PathBuf::from("proto");
    let proto_file = proto_dir.join("iris.proto");

    // 编译唯一契约文件；生成物包含 prost 消息与 tonic service 客户端/服务端代码
    tonic_build::configure()
        .build_server(true) // logic 侧实现 GatewayLink 服务端
        .build_client(true) // gateway 侧持有 GatewayLink 客户端
        .out_dir(PathBuf::from(std::env::var("OUT_DIR")?))
        .compile_protos(&[proto_file], &[proto_dir])?;

    // proto 文件变更时触发重新编译
    println!("cargo:rerun-if-changed=proto/iris.proto");
    Ok(())
}
