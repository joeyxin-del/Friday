# FastAPI 解耦架构设计

## 概述

通过 FastAPI 实现 Friday 应用和模型推理服务的解耦，使模型服务可以独立运行、扩展和优化。

## 当前架构 vs 解耦架构

### 当前架构（紧耦合）

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Tauri    │
│   (Rust)    │
└──────┬──────┘
       │ stdin/stdout JSON RPC
       ▼
┌─────────────┐
│   Python    │
│  Sidecar    │──┐
└─────────────┘  │
                 │ 直接调用
                 ▼
         ┌───────────────┐
         │  模型推理      │
         │ (PyMuPDF/     │
         │  DeepSeek-OCR)│
         └───────────────┘
```

**问题**：
- ❌ 模型和主应用生命周期绑定
- ❌ 无法独立扩展模型服务
- ❌ 无法远程部署模型
- ❌ 模型升级需要重启整个应用
- ❌ 多个模型需要共享同一进程

### 解耦架构（推荐）

```
┌─────────────┐
│   Frontend  │
│   (React)   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Tauri    │
│   (Rust)    │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌─────────────────────┐
│   FastAPI Gateway   │  ← 轻量级，只负责路由
│  (本地/远程)        │
└──────┬──────────────┘
       │ HTTP/WebSocket
       ▼
┌─────────────────────┐
│  模型推理服务       │  ← 独立进程，可扩展
│  (Model Service)    │
│  - DeepSeek-OCR     │
│  - Marker           │
│  - PyMuPDF          │
└─────────────────────┘
```

## 架构设计

### 方案 A：本地 FastAPI 服务（推荐用于单机）

**架构**：
```
Tauri → FastAPI (本地 localhost) → 模型服务
```

**优点**：
- ✅ 解耦但保持本地性能
- ✅ 模型服务可独立重启
- ✅ 易于调试和监控
- ✅ 支持多模型后端

**实施**：

1. **FastAPI Gateway** (`python/friday_api/main.py`)
   ```python
   from fastapi import FastAPI, File, UploadFile
   from fastapi.middleware.cors import CORSMiddleware
   import httpx
   
   app = FastAPI(title="Friday API Gateway")
   
   # CORS 配置（允许 Tauri 访问）
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["tauri://localhost", "http://localhost:1420"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   
   # 模型服务配置
   MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://localhost:8001")
   
   @app.post("/api/pdf/parse")
   async def parse_pdf(file: UploadFile = File(...)):
       """转发 PDF 解析请求到模型服务"""
       async with httpx.AsyncClient() as client:
           response = await client.post(
               f"{MODEL_SERVICE_URL}/pdf/parse",
               files={"file": (file.filename, await file.read())}
           )
           return response.json()
   ```

2. **模型服务** (`python/friday_models/main.py`)
   ```python
   from fastapi import FastAPI, File, UploadFile
   from fastapi.responses import StreamingResponse
   import asyncio
   
   app = FastAPI(title="Friday Model Service")
   
   # 模型管理器
   class ModelManager:
       def __init__(self):
           self.deepseek_ocr = None
           self.marker = None
           
       async def load_deepseek_ocr(self):
           """懒加载 DeepSeek-OCR"""
           if self.deepseek_ocr is None:
               from friday_models.deepseek_backend import DeepSeekOCRBackend
               self.deepseek_ocr = DeepSeekOCRBackend()
               await self.deepseek_ocr.load_model()
           return self.deepseek_ocr
   
   model_manager = ModelManager()
   
   @app.post("/pdf/parse")
   async def parse_pdf(
       file: UploadFile = File(...),
       backend: str = "auto"  # auto, deepseek, marker, pymupdf
   ):
       """解析 PDF"""
       pdf_bytes = await file.read()
       
       if backend == "auto":
           # 自动选择最佳后端
           backend = _select_best_backend(pdf_bytes)
       
       if backend == "deepseek":
           model = await model_manager.load_deepseek_ocr()
           result = await model.convert_pdf(pdf_bytes)
       elif backend == "marker":
           # 使用 Marker
           result = await convert_with_marker(pdf_bytes)
       else:
           # 使用 PyMuPDF（降级方案）
           result = await convert_with_pymupdf(pdf_bytes)
       
       return {"result": result}
   
   @app.get("/health")
   async def health():
       """健康检查"""
       return {"status": "healthy"}
   ```

3. **Tauri 客户端** (`src-tauri/src/api_client.rs`)
   ```rust
   use reqwest;
   use serde_json::Value;
   
   pub struct ApiClient {
       base_url: String,
       client: reqwest::Client,
   }
   
   impl ApiClient {
       pub fn new() -> Self {
           Self {
               base_url: "http://localhost:8000".to_string(),
               client: reqwest::Client::new(),
           }
       }
       
       pub async fn parse_pdf(&self, pdf_path: &str) -> Result<Value, Box<dyn std::error::Error>> {
           let file = std::fs::File::open(pdf_path)?;
           let mut form = reqwest::multipart::Form::new();
           form = form.file("file", pdf_path)?;
           
           let response = self.client
               .post(&format!("{}/api/pdf/parse", self.base_url))
               .multipart(form)
               .send()
               .await?;
           
           let result: Value = response.json().await?;
           Ok(result)
       }
   }
   ```

### 方案 B：远程模型服务（推荐用于多设备/云端）

**架构**：
```
Tauri → FastAPI Gateway (本地) → 远程模型服务 (可选)
```

**优点**：
- ✅ 模型服务可部署在 GPU 服务器
- ✅ 多设备共享模型服务
- ✅ 模型服务可独立扩展
- ✅ 支持负载均衡

**实施**：
- 模型服务可部署在远程服务器
- 通过环境变量配置服务地址
- 支持本地/远程自动切换

### 方案 C：混合架构（最灵活）

**架构**：
```
Tauri → FastAPI Gateway
         ├─ 本地模型服务 (轻量级任务)
         └─ 远程模型服务 (重型任务)
```

**优点**：
- ✅ 灵活选择部署方式
- ✅ 轻量级任务本地处理（快速）
- ✅ 重型任务远程处理（利用 GPU 服务器）

## 详细设计

### 1. FastAPI Gateway 设计

**职责**：
- 请求路由
- 认证和授权
- 限流和监控
- 错误处理

**文件结构**：
```
python/
├── friday_api/           # API Gateway
│   ├── main.py          # FastAPI 应用
│   ├── routes/          # 路由定义
│   │   ├── pdf.py
│   │   ├── video.py
│   │   └── audio.py
│   ├── middleware/      # 中间件
│   └── config.py        # 配置
└── friday_models/        # 模型服务
    ├── main.py          # 模型服务入口
    ├── backends/        # 模型后端
    │   ├── deepseek.py
    │   ├── marker.py
    │   └── pymupdf.py
    └── manager.py       # 模型管理器
```

### 2. 通信协议

**HTTP REST API**：
```http
POST /api/pdf/parse
Content-Type: multipart/form-data

{
  "file": <binary>,
  "backend": "auto" | "deepseek" | "marker" | "pymupdf",
  "options": {
    "use_llm": false,
    "force_ocr": false
  }
}
```

**WebSocket（用于进度更新）**：
```javascript
// 连接
ws://localhost:8000/ws/pdf/{task_id}

// 消息
{
  "type": "progress",
  "stage": "text",
  "progress": 50,
  "message": "正在提取文本..."
}
```

### 3. 模型服务管理

**模型加载策略**：
- **懒加载**: 首次使用时加载
- **预加载**: 启动时加载常用模型
- **卸载策略**: 长时间未使用自动卸载

**多模型支持**：
```python
class ModelManager:
    def __init__(self):
        self.models = {
            "deepseek-ocr": None,
            "marker": None,
            "pymupdf": None,
        }
        self.model_configs = {
            "deepseek-ocr": {
                "requires_gpu": True,
                "memory_gb": 8,
                "load_time": 10,  # 秒
            }
        }
    
    async def get_model(self, name: str):
        """获取模型（懒加载）"""
        if self.models[name] is None:
            await self._load_model(name)
        return self.models[name]
    
    async def _load_model(self, name: str):
        """加载模型"""
        config = self.model_configs[name]
        if config["requires_gpu"] and not self._has_gpu():
            raise RuntimeError(f"{name} requires GPU")
        
        # 加载模型...
```

### 4. 进度报告机制

**方案 1: WebSocket 实时推送**
```python
@app.post("/pdf/parse")
async def parse_pdf(file: UploadFile, websocket: WebSocket):
    await websocket.accept()
    task_id = str(uuid.uuid4())
    
    async def progress_callback(stage, progress, message):
        await websocket.send_json({
            "task_id": task_id,
            "type": "progress",
            "stage": stage,
            "progress": progress,
            "message": message
        })
    
    result = await parse_pdf_with_progress(file, progress_callback)
    await websocket.send_json({
        "task_id": task_id,
        "type": "complete",
        "result": result
    })
```

**方案 2: Server-Sent Events (SSE)**
```python
@app.get("/pdf/parse/stream/{task_id}")
async def stream_progress(task_id: str):
    async def event_generator():
        while True:
            progress = await get_progress(task_id)
            yield f"data: {json.dumps(progress)}\n\n"
            if progress["status"] == "complete":
                break
            await asyncio.sleep(0.1)
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

### 5. 错误处理和降级

```python
@app.post("/pdf/parse")
async def parse_pdf(file: UploadFile, backend: str = "auto"):
    try:
        # 尝试使用指定后端
        result = await parse_with_backend(file, backend)
    except ModelNotAvailableError:
        # 降级到可用后端
        available_backends = await get_available_backends()
        if "pymupdf" in available_backends:
            result = await parse_with_backend(file, "pymupdf")
        else:
            raise ServiceUnavailableError("No PDF parser available")
    
    return result
```

## 实施计划

### 阶段一：基础架构 ⏱️ 3-5 天

1. **FastAPI Gateway**
   - [ ] 创建 FastAPI 应用
   - [ ] 实现基础路由
   - [ ] 添加 CORS 支持
   - [ ] 添加健康检查

2. **模型服务框架**
   - [ ] 创建模型服务应用
   - [ ] 实现模型管理器
   - [ ] 实现懒加载机制

3. **Tauri 客户端**
   - [ ] 实现 HTTP 客户端
   - [ ] 替换现有 Python 调用
   - [ ] 添加错误处理

### 阶段二：功能集成 ⏱️ 5-7 天

1. **PDF 处理集成**
   - [ ] 集成 PyMuPDF 后端
   - [ ] 集成 DeepSeek-OCR 后端（可选）
   - [ ] 实现自动后端选择

2. **进度报告**
   - [ ] 实现 WebSocket/SSE
   - [ ] 集成到前端进度显示

3. **配置管理**
   - [ ] 服务发现和配置
   - [ ] 本地/远程切换

### 阶段三：优化和扩展 ⏱️ 3-5 天

1. **性能优化**
   - [ ] 连接池
   - [ ] 请求缓存
   - [ ] 批量处理

2. **监控和日志**
   - [ ] 请求日志
   - [ ] 性能监控
   - [ ] 错误追踪

3. **扩展功能**
   - [ ] 多模型并行
   - [ ] 任务队列
   - [ ] 负载均衡

## 优势分析

### ✅ 解耦带来的好处

1. **独立部署和扩展**
   - 模型服务可以独立部署在 GPU 服务器
   - 可以横向扩展（多实例）
   - 不影响主应用

2. **灵活的后端选择**
   - 可以轻松切换模型后端
   - 可以同时支持多个模型
   - 可以根据任务选择最佳模型

3. **更好的资源管理**
   - 模型服务可以独立管理 GPU 资源
   - 可以按需加载/卸载模型
   - 可以共享模型实例

4. **开发和调试**
   - 可以独立测试模型服务
   - 可以独立监控和优化
   - 更容易定位问题

5. **多客户端支持**
   - 多个 Friday 实例可以共享模型服务
   - 可以支持 Web 客户端
   - 可以支持 API 调用

### ⚠️ 需要注意的问题

1. **网络延迟**
   - 本地服务：几乎无延迟
   - 远程服务：可能有延迟
   - **缓解**: 本地优先，远程可选

2. **服务管理**
   - 需要管理服务生命周期
   - 需要处理服务故障
   - **缓解**: 自动重连，降级方案

3. **文件传输**
   - 大文件上传可能较慢
   - **缓解**: 流式上传，分块传输

## 代码示例

### FastAPI Gateway 完整示例

```python
# python/friday_api/main.py
from fastapi import FastAPI, File, UploadFile, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx
import os
from typing import Optional

app = FastAPI(title="Friday API Gateway")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 配置
MODEL_SERVICE_URL = os.getenv("MODEL_SERVICE_URL", "http://localhost:8001")
GATEWAY_PORT = int(os.getenv("GATEWAY_PORT", "8000"))

@app.get("/health")
async def health():
    """健康检查"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{MODEL_SERVICE_URL}/health", timeout=2.0)
            model_healthy = response.status_code == 200
    except:
        model_healthy = False
    
    return {
        "status": "healthy",
        "gateway": "ok",
        "model_service": "ok" if model_healthy else "unavailable"
    }

@app.post("/api/pdf/parse")
async def parse_pdf(
    file: UploadFile = File(...),
    backend: str = "auto",
    use_llm: bool = False
):
    """解析 PDF"""
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            files = {"file": (file.filename, await file.read(), file.content_type)}
            data = {"backend": backend, "use_llm": use_llm}
            
            response = await client.post(
                f"{MODEL_SERVICE_URL}/pdf/parse",
                files=files,
                data=data
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"Model service error: {str(e)}"}
        )

@app.websocket("/ws/pdf/{task_id}")
async def websocket_progress(websocket: WebSocket, task_id: str):
    """WebSocket 进度更新"""
    await websocket.accept()
    try:
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "GET",
                f"{MODEL_SERVICE_URL}/ws/pdf/{task_id}"
            ) as response:
                async for line in response.aiter_lines():
                    await websocket.send_text(line)
    except Exception as e:
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=GATEWAY_PORT)
```

### 模型服务完整示例

```python
# python/friday_models/main.py
from fastapi import FastAPI, File, UploadFile, WebSocket
from fastapi.responses import JSONResponse
import asyncio
from typing import Dict, Optional
import uuid

app = FastAPI(title="Friday Model Service")

class ModelManager:
    def __init__(self):
        self.models: Dict[str, any] = {}
        self.tasks: Dict[str, dict] = {}
    
    async def get_backend(self, name: str):
        """获取模型后端（懒加载）"""
        if name not in self.models:
            await self._load_backend(name)
        return self.models[name]
    
    async def _load_backend(self, name: str):
        """加载模型后端"""
        if name == "deepseek-ocr":
            from .backends.deepseek import DeepSeekOCRBackend
            self.models[name] = DeepSeekOCRBackend()
            await self.models[name].load()
        elif name == "marker":
            from .backends.marker import MarkerBackend
            self.models[name] = MarkerBackend()
            await self.models[name].load()
        elif name == "pymupdf":
            from .backends.pymupdf import PyMuPDFBackend
            self.models[name] = PyMuPDFBackend()
        else:
            raise ValueError(f"Unknown backend: {name}")

model_manager = ModelManager()

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/pdf/parse")
async def parse_pdf(
    file: UploadFile = File(...),
    backend: str = "auto",
    use_llm: bool = False
):
    """解析 PDF"""
    task_id = str(uuid.uuid4())
    pdf_bytes = await file.read()
    
    # 选择后端
    if backend == "auto":
        backend = await _select_best_backend(pdf_bytes)
    
    try:
        model = await model_manager.get_backend(backend)
        
        # 异步处理
        task = asyncio.create_task(
            model.convert_pdf(pdf_bytes, task_id=task_id)
        )
        model_manager.tasks[task_id] = {
            "status": "running",
            "backend": backend,
            "task": task
        }
        
        result = await task
        model_manager.tasks[task_id]["status"] = "completed"
        
        return {"task_id": task_id, "result": result}
    except Exception as e:
        model_manager.tasks[task_id]["status"] = "failed"
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/pdf/status/{task_id}")
async def get_status(task_id: str):
    """获取任务状态"""
    if task_id not in model_manager.tasks:
        return JSONResponse(status_code=404, content={"error": "Task not found"})
    
    return model_manager.tasks[task_id]

async def _select_best_backend(pdf_bytes: bytes) -> str:
    """自动选择最佳后端"""
    # 检查 GPU 可用性
    has_gpu = await check_gpu_available()
    
    if has_gpu:
        # 尝试使用 DeepSeek-OCR
        try:
            await model_manager.get_backend("deepseek-ocr")
            return "deepseek-ocr"
        except:
            pass
    
    # 降级到 PyMuPDF
    return "pymupdf"

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

## 启动和管理

### 启动脚本

```powershell
# start-services.ps1
# 启动模型服务
Start-Process python -ArgumentList "python/friday_models/main.py" -WindowStyle Hidden

# 等待服务启动
Start-Sleep -Seconds 3

# 启动 API Gateway
Start-Process python -ArgumentList "python/friday_api/main.py" -WindowStyle Hidden

# 启动 Tauri 应用
npm run tauri:dev
```

### Docker 部署（可选）

```dockerfile
# Dockerfile.model-service
FROM python:3.12-slim

WORKDIR /app
COPY python/friday_models/ .
RUN pip install -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## 总结

### ✅ 可行性: ⭐⭐⭐⭐⭐ (5/5)

**完全可以实现，而且非常推荐！**

### 核心优势

1. **完美解耦**: 应用和模型服务完全独立
2. **灵活部署**: 本地/远程/混合部署
3. **易于扩展**: 可以轻松添加新模型
4. **资源优化**: 模型服务可以独立管理资源
5. **开发友好**: 可以独立测试和调试

### 推荐方案

**方案 A（本地 FastAPI 服务）** + **渐进式迁移**

1. **第一步**: 实现 FastAPI Gateway 和基础模型服务
2. **第二步**: 迁移现有 PyMuPDF 到模型服务
3. **第三步**: 集成 DeepSeek-OCR 等新模型
4. **第四步**: 优化和扩展（远程部署、负载均衡等）

### 实施优先级

1. **高优先级**: FastAPI Gateway + 基础模型服务框架
2. **中优先级**: 迁移现有功能 + 进度报告
3. **低优先级**: 远程部署 + 高级功能

---

**结论**: 通过 FastAPI 解耦是一个**非常好的架构决策**，可以显著提升系统的灵活性和可维护性！

