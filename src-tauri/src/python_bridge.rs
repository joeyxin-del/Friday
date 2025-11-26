use serde_json::Value;
use std::process::{Command, Stdio};
use std::io::{Write, BufRead, BufReader};
use std::thread;

pub async fn call_python(
    cmd: &str, 
    payload: Value,
    window: Option<tauri::Window>,
) -> Result<Value, Box<dyn std::error::Error>> {
    // 构建 JSON RPC 请求
    let request = serde_json::json!({
        "cmd": cmd,
        "payload": payload
    });

    // 调用 Python Sidecar
    // 在 Windows 上，尝试使用 conda 环境中的 Python
    let python_cmd = if cfg!(windows) {
        // 策略1: 尝试从环境变量获取 conda Python 路径
        let mut python_path = None;
        
        if let Ok(conda_prefix) = std::env::var("CONDA_PREFIX") {
            let path = format!("{}\\python.exe", conda_prefix);
            if std::path::Path::new(&path).exists() {
                python_path = Some(path);
            }
        }
        
        // 策略2: 尝试从 CONDA_DEFAULT_ENV 构建路径
        if python_path.is_none() {
            if let Ok(conda_default_env) = std::env::var("CONDA_DEFAULT_ENV") {
                if let Ok(conda_base) = std::env::var("CONDA_BASE") {
                    let path = format!("{}\\envs\\{}\\python.exe", conda_base, conda_default_env);
                    if std::path::Path::new(&path).exists() {
                        python_path = Some(path);
                    }
                }
            }
        }
        
        // 策略3: 尝试从 PATH 中查找 python.exe
        if python_path.is_none() {
            if let Ok(path_var) = std::env::var("PATH") {
                for path_dir in path_var.split(';') {
                    let test_path = std::path::Path::new(path_dir).join("python.exe");
                    if test_path.exists() {
                        python_path = Some(test_path.to_string_lossy().to_string());
                        break;
                    }
                }
            }
        }
        
        // 策略4: 使用默认的 "python" 命令（依赖系统 PATH）
        python_path.unwrap_or_else(|| "python".to_string())
    } else {
        "python3".to_string()
    };
    
    // 获取项目根目录（可能从 src-tauri 目录运行，需要向上查找）
    let mut project_root = std::env::current_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    
    // 如果当前在 src-tauri 目录，向上查找项目根目录
    let python_script = loop {
        let test_path = project_root.join("python").join("main.py");
        if test_path.exists() {
            break test_path;
        }
        
        // 尝试向上查找
        if let Some(parent) = project_root.parent() {
            project_root = parent.to_path_buf();
        } else {
            // 如果找不到，使用当前目录
            let fallback = project_root.join("python").join("main.py");
            return Err(format!(
                "Python script not found. Searched in: {}\nExpected location: {}",
                project_root.display(),
                fallback.display()
            ).into());
        }
    };
    
    let mut child = Command::new(&python_cmd)
        .arg(python_script.to_str().unwrap())
        .current_dir(&project_root)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            format!("Failed to spawn Python process with command '{}': {}\nHint: Make sure conda environment is activated and Python is in PATH", python_cmd, e)
        })?;

    // 发送请求（确保使用 UTF-8 编码）
    if let Some(stdin) = child.stdin.as_mut() {
        let request_str = serde_json::to_string(&request)?;
        stdin.write_all(request_str.as_bytes())?;
        stdin.flush()?; // 确保数据被发送
    }

    // 如果有窗口，启动进度监听线程（从 stderr 读取进度）
    if let Some(win) = window.clone() {
        let stderr = child.stderr.take().unwrap();
        let reader = BufReader::new(stderr);
        
        thread::spawn(move || {
            for line in reader.lines() {
                if let Ok(line) = line {
                    // 检查是否是进度信息
                    if line.starts_with("PROGRESS:") {
                        let parts: Vec<&str> = line.strip_prefix("PROGRESS:").unwrap().splitn(3, ':').collect();
                        if parts.len() == 3 {
                            let stage = parts[0];
                            let progress = parts[1].parse::<i32>().unwrap_or(0);
                            let message = parts[2];
                            
                            let _ = win.emit("pdf-progress", serde_json::json!({
                                "stage": stage,
                                "progress": progress,
                                "message": message
                            }));
                        }
                    }
                }
            }
        });
    }

    // 等待响应
    let output = child.wait_with_output()?;
    
    // 解析响应（stdout 只包含 JSON）
    let response_str = String::from_utf8_lossy(&output.stdout);
    
    // 先尝试解析 JSON 响应（即使进程失败，也可能有错误 JSON）
    if let Ok(response) = serde_json::from_str::<Value>(&response_str) {
        // 检查响应中是否有错误
        if let Some(error_msg) = response.get("error").and_then(|e| e.as_str()) {
            return Err(format!("Python error: {}", error_msg).into());
        }
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("Python process failed: {}\nStderr: {}", response_str, stderr).into());
        }
        
        return Ok(response);
    }
    
    // 如果 JSON 解析失败，检查进程状态
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = response_str.to_string();
        let exit_code = output.status.code().unwrap_or(-1);
        
        // 提供更友好的错误信息
        let mut error_msg = format!("Python 进程退出，代码: {}\n", exit_code);
        
        if !stdout.is_empty() {
            error_msg.push_str(&format!("标准输出: {}\n", stdout));
        }
        if !stderr.is_empty() {
            error_msg.push_str(&format!("错误输出: {}\n", stderr));
        }
        
        // 根据退出代码提供建议
        match exit_code {
            2 => error_msg.push_str("\n提示: 可能的原因：\n1. Python 命令未找到（请确保 conda 环境已激活）\n2. Python 脚本路径错误\n3. 缺少必要的 Python 依赖"),
            _ => error_msg.push_str("\n提示: 请检查 Python 脚本和依赖是否正确安装"),
        }
        
        return Err(error_msg.into());
    }

    // 如果进程成功但 JSON 解析失败
    Err(format!("Failed to parse Python response as JSON: {}", response_str).into())
}


