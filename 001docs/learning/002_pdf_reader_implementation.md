# PDF 阅读器功能实现总结

## 概述

PDF 阅读器是 Friday 项目的核心功能之一，负责将 PDF 文件转换为结构化的 Markdown 格式，并提取其中的图片。本文档详细说明了该功能的实现方式。

## 架构设计

### 整体架构

```
┌─────────────────┐
│  React 前端      │  (用户界面)
│  (Reader.tsx)   │
└────────┬────────┘
         │ invoke("parse_pdf")
         ▼
┌─────────────────┐
│  Rust 后端      │  (Tauri Commands)
│  (commands.rs)  │
└────────┬────────┘
         │ JSON RPC over stdin/stdout
         ▼
┌─────────────────┐
│  Python Sidecar │  (处理逻辑)
│  (main.py)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PDF 处理模块   │  (PyMuPDF)
│  (friday_reader)│
└─────────────────┘
```

### 技术栈

- **前端**: React + TypeScript + TailwindCSS
- **桌面框架**: Tauri (Rust)
- **后端处理**: Python 3.10+ (PyMuPDF)
- **通信协议**: JSON RPC (通过 stdin/stdout)
- **进度报告**: Tauri Events (通过 stderr)

## 实现细节

### 1. 前端实现 (React)

**文件位置**: `src/pages/Reader.tsx`

#### 核心功能

1. **文件选择**
   ```typescript
   const selected = await open({
     multiple: false,
     filters: [{ name: "PDF", extensions: ["pdf"] }],
   });
   ```

2. **调用后端命令**
   ```typescript
   const resource = await invoke("parse_pdf", { path: selected });
   ```

3. **进度监听**
   ```typescript
   useEffect(() => {
     const unlisten = listen<ProgressInfo>("pdf-progress", (event) => {
       setProgress(event.payload);
     });
     return () => unlisten.then((fn) => fn());
   }, []);
   ```

#### UI 组件

- **文件选择按钮**: 使用 Tauri 的 `dialog.open` API
- **进度条**: 实时显示处理进度（0-100%）
- **状态提示**: 显示当前处理阶段和消息
- **结果展示**: JSON 格式显示处理结果

### 2. Rust 后端实现

**文件位置**: 
- `src-tauri/src/commands.rs` - Tauri 命令定义
- `src-tauri/src/python_bridge.rs` - Python 通信桥接

#### Tauri 命令 (`commands.rs`)

```rust
#[tauri::command]
pub async fn parse_pdf(
    path: String,
    window: tauri::Window,
) -> Result<Resource, String> {
    // 发送开始事件
    window.emit("pdf-progress", json!({
        "stage": "开始",
        "progress": 0,
        "message": "正在初始化 PDF 解析..."
    }));
    
    // 调用 Python Sidecar
    let result = python_bridge::call_python(
        "parse_pdf", 
        json!({ "path": path }), 
        Some(window.clone())
    ).await?;
    
    // 返回结果
    serde_json::from_value(result.get("result").cloned().unwrap())
}
```

#### Python 桥接 (`python_bridge.rs`)

**关键功能**:

1. **Python 路径检测** (Windows)
   - 策略1: 从 `CONDA_PREFIX` 环境变量获取
   - 策略2: 从 `CONDA_DEFAULT_ENV` 和 `CONDA_BASE` 构建路径
   - 策略3: 从系统 PATH 中查找
   - 策略4: 使用默认 "python" 命令

2. **项目根目录查找**
   ```rust
   let mut project_root = std::env::current_dir()?;
   let python_script = loop {
       let test_path = project_root.join("python").join("main.py");
       if test_path.exists() {
           break test_path;
       }
       if let Some(parent) = project_root.parent() {
           project_root = parent.to_path_buf();
       } else {
           return Err("Python script not found".into());
       }
   };
   ```

3. **进程通信**
   - **stdin**: 发送 JSON RPC 请求
   - **stdout**: 接收 JSON 响应
   - **stderr**: 接收进度信息（`PROGRESS:` 前缀）

4. **进度事件转发**
   ```rust
   thread::spawn(move || {
       for line in reader.lines() {
           if line.starts_with("PROGRESS:") {
               let parts: Vec<&str> = line.splitn(3, ':').collect();
               win.emit("pdf-progress", json!({
                   "stage": parts[0],
                   "progress": parts[1].parse::<i32>().unwrap(),
                   "message": parts[2]
               }));
           }
       }
   });
   ```

### 3. Python 后端实现

**文件位置**:
- `python/main.py` - 主入口
- `python/friday_core/router.py` - 命令路由
- `python/friday_reader/main.py` - PDF 处理逻辑

#### 主入口 (`main.py`)

**JSON RPC 处理**:
```python
def main():
    # 从 stdin 读取 JSON（确保 UTF-8 编码）
    if hasattr(sys.stdin, 'buffer'):
        input_bytes = sys.stdin.buffer.read()
        input_data = input_bytes.decode('utf-8')
    else:
        input_data = sys.stdin.read()
    
    request = json.loads(input_data)
    result = asyncio.run(handle_request(request))
    
    # 输出到 stdout（确保 UTF-8 编码）
    output_json = json.dumps(result, ensure_ascii=False)
    if hasattr(sys.stdout, 'buffer'):
        sys.stdout.buffer.write(output_json.encode('utf-8'))
        sys.stdout.buffer.flush()
```

**关键点**:
- 正确处理 UTF-8 编码（支持中文路径）
- 使用二进制模式处理 stdin/stdout

#### 命令路由 (`router.py`)

```python
class Router:
    def __init__(self):
        self.handlers = {
            "parse_pdf": self._handle_parse_pdf,
            # ... 其他命令
        }
    
    async def route(self, cmd: str, payload: Dict[str, Any]):
        handler = self.handlers.get(cmd)
        return await handler(payload)
```

#### PDF 处理 (`friday_reader/main.py`)

**处理流程**:

1. **路径验证和规范化**
   ```python
   # 确保路径是字符串类型
   if not isinstance(pdf_path, str):
       pdf_path = str(pdf_path)
   
   # 规范化路径
   pdf_path = pdf_path.replace('/', '\\') if '\\' in pdf_path else pdf_path
   pdf_path_obj = Path(pdf_path)
   
   if not pdf_path_obj.exists():
       raise FileNotFoundError(f"PDF file not found: {pdf_path}")
   ```

2. **创建输出目录**
   ```python
   resource_id = str(uuid.uuid4())
   library_path = Path(Config.LIBRARY_PATH)  # 默认: "library"
   resource_dir = library_path / resource_id
   assets_dir = resource_dir / "assets"
   ```

3. **文本提取** (40% 进度)
   ```python
   def text_progress(current: int, total: int):
       progress = int((current / total) * 40)
       print(f"PROGRESS:text:{progress}:正在提取文本 ({current}/{total} 页)...", 
             file=sys.stderr, flush=True)
   
   text_content = _extract_text_from_pdf(pdf_path, text_progress)
   ```

4. **图片提取** (30% 进度)
   ```python
   def image_progress(current: int, total: int):
       progress = 40 + int((current / total) * 30)
       print(f"PROGRESS:images:{progress}:正在提取图片 ({current}/{total} 页)...", 
             file=sys.stderr, flush=True)
   
   image_paths = _extract_images_from_pdf(pdf_path, assets_dir, image_progress)
   ```

5. **生成 Markdown** (30% 进度)
   ```python
   markdown_content = f"# {title}\n\n"
   markdown_content += f"**来源**: {pdf_path}\n\n"
   markdown_content += f"**处理时间**: {datetime.now().isoformat()}\n\n"
   markdown_content += "---\n\n"
   markdown_content += text_content
   
   # 添加图片引用
   for img_path in image_paths:
       img_name = Path(img_path).name
       markdown_content += f"![{img_name}](assets/{img_name})\n\n"
   
   md_path = resource_dir / f"{title}.md"
   with open(md_path, "w", encoding="utf-8") as f:
       f.write(markdown_content)
   ```

## 通信机制

### JSON RPC 协议

**请求格式**:
```json
{
  "cmd": "parse_pdf",
  "payload": {
    "path": "E:\\path\\to\\file.pdf"
  }
}
```

**响应格式**:
```json
{
  "result": {
    "id": "uuid",
    "type": "pdf",
    "title": "文件名",
    "source": "原始路径",
    "md_path": "library/uuid/文件名.md",
    "assets": ["library/uuid/assets/page_1_img_1.png"],
    "created_at": "2025-11-26T20:24:30",
    "updated_at": "2025-11-26T20:24:30"
  }
}
```

**错误响应**:
```json
{
  "error": "错误信息"
}
```

### 进度报告机制

**进度消息格式** (通过 stderr):
```
PROGRESS:{stage}:{progress}:{message}
```

**示例**:
```
PROGRESS:text:20:正在提取文本 (5/25 页)...
PROGRESS:images:50:正在提取图片 (10/25 页)...
PROGRESS:markdown:80:正在生成 Markdown...
PROGRESS:complete:100:PDF 解析完成
```

**进度阶段**:
- `text`: 文本提取 (0-40%)
- `images`: 图片提取 (40-70%)
- `markdown`: Markdown 生成 (70-100%)
- `complete`: 完成 (100%)

## 文件输出结构

处理后的文件保存在 `library` 目录下：

```
library/
└── {resource_id}/              # UUID 标识符
    ├── {title}.md              # Markdown 文件
    └── assets/                 # 提取的图片
        ├── page_1_img_1.png
        ├── page_2_img_1.png
        └── ...
```

**配置**:
- 默认路径: `library` (项目根目录)
- 可通过环境变量 `LIBRARY_PATH` 修改

## 关键技术点

### 1. 编码处理

**问题**: Windows 上路径包含中文字符时可能出现编码问题

**解决方案**:
- Rust: 使用 UTF-8 编码发送 JSON
- Python: 正确处理 stdin/stdout 的二进制模式
  ```python
  if hasattr(sys.stdin, 'buffer'):
      input_bytes = sys.stdin.buffer.read()
      input_data = input_bytes.decode('utf-8')
  ```

### 2. 路径查找

**问题**: Tauri 应用运行时工作目录可能是 `src-tauri`，而不是项目根目录

**解决方案**: 向上查找直到找到 `python/main.py`
```rust
let mut project_root = std::env::current_dir()?;
loop {
    let test_path = project_root.join("python").join("main.py");
    if test_path.exists() {
        break test_path;
    }
    project_root = project_root.parent()?;
}
```

### 3. Python 环境检测

**问题**: 需要找到正确的 Python 解释器（特别是 conda 环境）

**解决方案**: 多策略检测
1. 环境变量 `CONDA_PREFIX`
2. 环境变量 `CONDA_DEFAULT_ENV` + `CONDA_BASE`
3. 系统 PATH
4. 默认 "python" 命令

### 4. 进度实时更新

**问题**: 长时间处理需要实时反馈进度

**解决方案**: 
- Python 通过 stderr 输出进度消息（`PROGRESS:` 前缀）
- Rust 在独立线程中读取 stderr 并转发为 Tauri 事件
- React 监听事件并更新 UI

## 遇到的问题和解决方案

### 问题 1: Python 路径找不到

**症状**: `Process exited with code 2`

**原因**: Tauri 应用运行时无法获取 conda 环境变量

**解决方案**: 
- 添加多策略 Python 路径检测
- 提供启动脚本 `start-dev.ps1` 自动激活环境

### 问题 2: 中文路径编码错误

**症状**: 路径中的中文字符变成 `?`

**原因**: JSON 传递时编码丢失

**解决方案**:
- Python 端正确处理 UTF-8 编码
- 使用二进制模式处理 stdin/stdout

### 问题 3: 工作目录错误

**症状**: `Python script not found: src-tauri/python/main.py`

**原因**: Tauri 应用从 `src-tauri` 目录运行

**解决方案**: 向上查找项目根目录

### 问题 4: 进度不更新

**症状**: 进度条一直显示 0%

**原因**: stderr 读取线程未正确启动

**解决方案**: 
- 确保在 spawn 后立即 take stderr
- 使用独立线程读取并转发事件

## 性能优化建议

1. **大文件处理**: 考虑分页处理，避免内存溢出
2. **图片压缩**: 提取的图片可以压缩以节省空间
3. **异步处理**: 已使用 async/await，可进一步优化并发
4. **缓存机制**: 相同 PDF 可以缓存处理结果

## 扩展方向

1. **OCR 支持**: 对于扫描版 PDF，添加 OCR 功能
2. **公式识别**: 使用 MathPix 等 API 识别数学公式
3. **表格提取**: 识别并提取表格数据
4. **向量化**: 将文本向量化并存储到 ChromaDB
5. **批量处理**: 支持一次处理多个 PDF

## 总结

PDF 阅读器功能通过 Tauri + Python Sidecar 架构实现，充分利用了：
- **Tauri**: 提供桌面应用框架和系统集成
- **Python**: 丰富的 PDF 处理库（PyMuPDF）
- **JSON RPC**: 简单的进程间通信
- **Tauri Events**: 实时进度更新

该实现具有良好的可扩展性，可以轻松添加新的处理功能（如 OCR、公式识别等）。

---

**最后更新**: 2025-11-26

