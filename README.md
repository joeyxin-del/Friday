# Friday - 科研向本地 AI 助手

Friday 是一款科研向的本地 AI 助手，负责将 PDF、视频、音频等非结构化资料转化为结构化知识并支持进一步检索、问答与分析。

## 技术栈

- **前端**: React + TypeScript + Vite + TailwindCSS
- **桌面框架**: Tauri (Rust)
- **后端**: Python Sidecar
- **数据库**: SQLite + ChromaDB

## 核心功能

### 📄 PDF 处理模块 (Friday-Reader)

将学术论文和 PDF 文档转换为结构化知识：

- **智能解析**：支持单栏/双栏版面分析，自动识别文档结构
- **内容提取**：文本抽取、数学公式识别（LaTeX 输出）、图表提取
- **可视化预览**：Markdown 实时渲染与预览
- **格式导出**：支持 Markdown 格式导出，保留原始结构
- **资源管理**：自动存储到 Library，便于后续检索

### 🎥 视频处理模块 (Friday-Watcher)

从视频中提取知识，支持 YouTube 和 Bilibili：

- **链接解析**：自动识别并解析视频链接，获取元数据（标题/封面/时长）
- **字幕提取**：自动下载或提取内置字幕
- **智能总结**：使用长上下文大模型生成全文总结
- **关键片段**：自动检测时间轴上的关键片段
- **内容问答**：基于视频字幕进行问答分析
- **结果存储**：处理结果自动保存到 Library

### 🎧 音频处理模块 (Friday-Listener)

将音频文件转换为结构化文本：

- **多格式支持**：支持 MP3、WAV、M4A、FLAC、OGG 等格式
- **音频可视化**：音频波形展示
- **语音转写**：使用 Faster-Whisper 进行高精度 ASR 转写
- **说话人分离**：使用 Pyannote 自动识别和分离不同说话人
- **术语校正**：基于提示词进行专业术语校正
- **逐字稿导出**：支持 TXT 和 Markdown 格式导出，包含时间戳

### 🤖 AI Agent (Friday-Core)

智能任务调度和自然语言交互：

- **自然语言指令**：使用自然语言描述任务，Friday 自动理解并执行
- **意图识别**：智能识别用户意图（PDF/视频/音频处理）
- **任务队列**：支持多任务排队处理，实时显示任务状态
- **人格化回复**：Friday 提供友好的交互体验
- **任务日志**：完整的任务执行日志和状态追踪

### 📚 系统功能

统一的知识管理和扩展能力：

- **Library 资源库**：统一管理所有处理过的资源（PDF/视频/音频）
- **统一资源模型**：标准化的资源数据结构，便于检索和分析
- **插件系统**：支持自定义插件，自动识别 `plugins/` 文件夹中的插件
- **设置管理**：API Key 配置、安全性设置、本地路径管理
- **日志系统**：本地日志记录，便于问题排查

## 项目结构

```
Friday/
├── src/                    # React 前端代码
│   ├── components/         # UI 组件
│   ├── pages/              # 页面
│   ├── stores/             # 状态管理
│   ├── services/           # API 服务
│   └── utils/              # 工具函数
├── src-tauri/              # Tauri Rust 代码
│   ├── src/                # Rust 源码
│   └── Cargo.toml          # Rust 依赖
├── python/                  # Python Sidecar
│   ├── friday_core/        # 核心模块
│   ├── friday_reader/      # PDF 模块
│   ├── friday_watcher/     # 视频模块
│   ├── friday_listener/    # 音频模块
│   └── plugins/            # 插件系统
└── 001docs/                # 文档
```

## 开发

### 前置要求

- Node.js 18+
- Rust (安装 Tauri CLI 时会自动安装)
- Python 3.10+
- 系统依赖（根据平台不同）

### 安装依赖

```bash
# 前端依赖
npm install

# Python 依赖（使用 Conda）
cd python
conda env create -f environment.yml
conda activate friday
cd ..
```

**注意**：每次开发前需要激活 Conda 环境：
```bash
conda activate friday
```

### 运行开发环境

```bash
npm run tauri:dev
```

### 构建

```bash
npm run tauri:build
```

## 功能模块

- **PDF 模块 (Friday-Reader)**: PDF 解析、文本抽取、公式识别、图表提取
- **视频模块 (Friday-Watcher)**: 视频链接解析、字幕获取、总结、关键片段
- **音频模块 (Friday-Listener)**: ASR 转写、说话人分离、逐字稿导出
- **AI Agent (Friday-Core)**: 意图识别、任务队列、人格化回复

## 故障排除

如果遇到问题，请查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 获取详细的故障排除指南。

常见问题包括：
- Cargo 网络连接问题
- Node.js 版本过低
- Rust/Cargo 未安装
- 依赖安装失败

## 许可证

MIT

