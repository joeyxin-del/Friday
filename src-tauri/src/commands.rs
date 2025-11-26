use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
pub struct Resource {
    pub id: String,
    pub r#type: String, // pdf | video | audio
    pub title: String,
    pub source: String,
    pub md_path: Option<String>,
    pub assets: Vec<String>,
    pub vector_index: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub status: String, // pending | running | completed | failed
    pub cmd: String,
    pub payload: serde_json::Value,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Settings {
    pub api_keys: HashMap<String, String>,
    pub library_path: String,
    pub log_level: String,
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
pub async fn parse_pdf(
    path: String,
    window: tauri::Window,
) -> Result<Resource, String> {
    use crate::python_bridge;
    
    // 发送开始事件
    let _ = window.emit("pdf-progress", serde_json::json!({
        "stage": "开始",
        "progress": 0,
        "message": "正在初始化 PDF 解析..."
    }));
    
    // 调用 Python Sidecar 处理 PDF（传递窗口用于进度事件）
    let result = python_bridge::call_python("parse_pdf", serde_json::json!({ "path": path }), Some(window.clone()))
        .await
        .map_err(|e| {
            let _ = window.emit("pdf-progress", serde_json::json!({
                "stage": "错误",
                "progress": 0,
                "message": format!("PDF 解析失败: {}", e)
            }));
            e.to_string()
        })?;
    
    // 发送完成事件
    let _ = window.emit("pdf-progress", serde_json::json!({
        "stage": "完成",
        "progress": 100,
        "message": "PDF 解析完成"
    }));
    
    serde_json::from_value(result.get("result").cloned().unwrap_or(serde_json::Value::Null))
        .map_err(|e| format!("Failed to parse result: {}", e))
}

#[tauri::command]
pub async fn process_video(url: String) -> Result<Resource, String> {
    // TODO: 调用 Python Sidecar 处理视频
    use crate::python_bridge;
    let result = python_bridge::call_python("process_video", serde_json::json!({ "url": url }), None)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::from_value(result.get("result").cloned().unwrap_or(serde_json::Value::Null))
        .map_err(|e| format!("Failed to parse result: {}", e))
}

#[tauri::command]
pub async fn process_audio(path: String) -> Result<Resource, String> {
    // TODO: 调用 Python Sidecar 处理音频
    use crate::python_bridge;
    let result = python_bridge::call_python("process_audio", serde_json::json!({ "path": path }), None)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::from_value(result.get("result").cloned().unwrap_or(serde_json::Value::Null))
        .map_err(|e| format!("Failed to parse result: {}", e))
}

#[tauri::command]
pub async fn execute_command(command: String) -> Result<Task, String> {
    // TODO: 通过 Friday-Core 执行自然语言命令
    use crate::python_bridge;
    let result = python_bridge::call_python("execute_command", serde_json::json!({ "command": command }), None)
        .await
        .map_err(|e| e.to_string())?;
    
    serde_json::from_value(result.get("result").cloned().unwrap_or(serde_json::Value::Null))
        .map_err(|e| format!("Failed to parse result: {}", e))
}

#[tauri::command]
pub async fn get_resources() -> Result<Vec<Resource>, String> {
    // TODO: 从数据库读取资源列表
    Ok(vec![])
}

#[tauri::command]
pub async fn get_resource_by_id(id: String) -> Result<Resource, String> {
    // TODO: 从数据库读取单个资源
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn save_resource(resource: Resource) -> Result<(), String> {
    // TODO: 保存资源到数据库
    Ok(())
}

#[tauri::command]
pub async fn delete_resource(id: String) -> Result<(), String> {
    // TODO: 从数据库删除资源
    Ok(())
}

#[tauri::command]
pub async fn get_settings() -> Result<Settings, String> {
    // TODO: 从配置文件读取设置
    Ok(Settings {
        api_keys: HashMap::new(),
        library_path: "library".to_string(),
        log_level: "info".to_string(),
    })
}

#[tauri::command]
pub async fn update_settings(settings: Settings) -> Result<(), String> {
    // TODO: 保存设置到配置文件
    Ok(())
}

#[tauri::command]
pub async fn get_task_status(id: String) -> Result<Task, String> {
    // TODO: 从任务队列获取任务状态
    Err("Not implemented".to_string())
}

#[tauri::command]
pub async fn list_tasks() -> Result<Vec<Task>, String> {
    // TODO: 获取所有任务列表
    Ok(vec![])
}

