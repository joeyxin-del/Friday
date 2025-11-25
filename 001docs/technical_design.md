# Friday 技术方案文档（Technical Design Doc）

## 1. 总体架构
Friday 采用 **Tauri + Python Sidecar + 本地模型/云模型混合架构**，提供高性能桌面体验与强大的 AI 处理能力。

```
Frontend (React) → Tauri (Rust Shell) → Python Sidecar → 模型/工具
```

- **React/TS**：UI 交互、状态管理
- **Tauri (Rust)**：文件权限、安全沙箱、窗口管理、与 Python 通信
- **Python 引擎**：负责所有 AI 与计算密集任务（OCR、ASR、RAG）

---

## 2. 模块架构

### 2.1 PDF 子系统（MinerU + LlamaIndex）
流程：
1. Rust 接收文件 → 传给 Python
2. Python 调用 MinerU 解析 PDF
3. 生成结构化 JSON Layout Tree
4. 转换为 Markdown + 资源包
5. 回传给 Tauri 显示

### 2.2 视频子系统（yt-dlp + Gemini/Claude API）
流程：
1. Rust 获取视频链接
2. Python 通过 yt-dlp 下载字幕
3. 合并、清洗字幕
4. 使用长上下文 LLM 进行总结
5. 生成关键片段

### 2.3 音频子系统（Faster-Whisper + Pyannote）
流程：
1. Rust 处理本地文件
2. Python 执行 ASR 推理
3. Pyannote 进行说话人分离
4. 输出带时间戳的逐字稿

### 2.4 Friday-Core（Agent Engine）
- 意图识别（LLM + 规则模板）
- 模块调度器（Resource Router）
- 任务队列（Task Queue）
- 日志系统

---

## 3. 数据层设计

### 3.1 数据库（SQLite + ChromaDB）
- SQLite：资源元数据（Resource）、任务状态、设置
- ChromaDB：向量索引（跨文档问答）

### 3.2 统一 Resource Schema
```json
{
  "id": "uuid",
  "type": "pdf | video | audio",
  "title": "string",
  "source": "path or url",
  "md_path": "path",
  "assets": ["path"],
  "vector_index": "optional"
}
```

---

## 4. 通信方案（Tauri ↔ Python）

### 4.1 协议
- JSON RPC
- 所有任务均为：`cmd + payload`

### 4.2 模型例
```json
{
  "cmd": "parse_pdf",
  "payload": { "path": "./test.pdf" }
}
```

---

## 5. 插件系统设计
- 插件为 Python 文件，放入 `plugins/`
- Friday 启动时扫描所有 `.py`
- 注册形如：
```python
@friday_plugin(name="ner_extractor")
def run(payload):
    ...
```

---

## 6. 性能方案
- Python 进程懒加载
- 模型按需加载（Lazy Load）
- GPU 加速（Whisper/OCR）
- 大任务后台运行（Task Queue）

---

## 7. 安全方案
- Keychain 存储 API Key
- Tauri FS scope 限制在工作区
- 日志与缓存本地化，不上传

---

