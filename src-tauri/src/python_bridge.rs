use serde_json::Value;
use std::process::{Command, Stdio};
use std::io::Write;

pub async fn call_python(cmd: &str, payload: Value) -> Result<Value, Box<dyn std::error::Error>> {
    // 构建 JSON RPC 请求
    let request = serde_json::json!({
        "cmd": cmd,
        "payload": payload
    });

    // 调用 Python Sidecar
    let mut child = Command::new("python")
        .arg("python/main.py")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()?;

    // 发送请求
    if let Some(stdin) = child.stdin.as_mut() {
        let request_str = serde_json::to_string(&request)?;
        stdin.write_all(request_str.as_bytes())?;
    }

    // 等待响应
    let output = child.wait_with_output()?;
    
    if !output.status.success() {
        let error = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Python error: {}", error).into());
    }

    // 解析响应
    let response_str = String::from_utf8_lossy(&output.stdout);
    let response: Value = serde_json::from_str(&response_str)?;

    Ok(response)
}


