# Friday - 科研向本地 AI 助手

Friday 是一款科研向的本地 AI 助手，负责将 PDF、视频、音频等非结构化资料转化为结构化知识并支持进一步检索、问答与分析。

## 技术栈

- **前端**: React + TypeScript + Vite + TailwindCSS
- **桌面框架**: Tauri (Rust)
- **后端**: Python Sidecar
- **数据库**: SQLite + ChromaDB

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

