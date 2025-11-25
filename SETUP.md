# Friday 项目设置指南

## 前置要求

### 1. Node.js 和 npm
- Node.js 18+ 
- npm 或 yarn

### 2. Rust
安装 Rust（Tauri 会自动安装，但也可以手动安装）：
```bash
# Windows (PowerShell)
# 下载并运行 https://rustup.rs/

# 或使用 Chocolatey
choco install rust
```

### 3. Python
- Python 3.10+
- pip

### 4. 系统依赖

#### Windows
- Microsoft Visual C++ Build Tools
- WebView2 (通常已预装)

#### macOS
```bash
xcode-select --install
```

#### Linux
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
    build-essential \
    curl \
    wget \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

## 安装步骤

### 1. 安装前端依赖
```bash
npm install
```

### 2. 创建并激活 Conda 虚拟环境

#### 方法一：使用 environment.yml（推荐）
```bash
cd python
conda env create -f environment.yml
conda activate friday
cd ..
```

#### 方法二：手动创建环境
```bash
cd python
conda create -n friday python=3.10
conda activate friday
pip install -r requirements.txt
cd ..
```

**注意**：每次开发前都需要激活环境：
```bash
conda activate friday
```

如果需要 GPU 支持（用于 Faster-Whisper 等），可以安装 PyTorch GPU 版本：
```bash
conda activate friday
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia
```

### 3. 配置环境变量
```bash
# 复制示例配置文件
cp python/.env.example python/.env

# 编辑 python/.env，填入你的 API Keys
# OPENAI_API_KEY=your_key_here
# GEMINI_API_KEY=your_key_here
# CLAUDE_API_KEY=your_key_here
```

### 4. 初始化数据库
数据库会在首次运行时自动创建。

## 运行项目

### 开发模式
```bash
npm run tauri:dev
```

这将：
1. 启动 Vite 开发服务器（前端）
2. 编译 Rust 代码（Tauri）
3. 启动桌面应用

### 构建生产版本
```bash
npm run tauri:build
```

构建产物在 `src-tauri/target/release/` 目录。

## 项目结构说明

```
Friday/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── pages/              # 页面组件
│   └── ...
├── src-tauri/              # Tauri Rust 后端
│   ├── src/
│   │   ├── main.rs         # 主入口
│   │   ├── commands.rs     # Tauri 命令
│   │   └── python_bridge.rs # Python 通信桥接
│   └── ...
├── python/                  # Python Sidecar
│   ├── friday_core/        # 核心模块（Agent、Router）
│   ├── friday_reader/      # PDF 处理模块
│   ├── friday_watcher/     # 视频处理模块
│   ├── friday_listener/    # 音频处理模块
│   ├── plugins/            # 插件系统
│   └── main.py             # Python 入口
└── 001docs/                # 文档
```

## 开发工作流

### 前端开发
- 修改 `src/` 下的 React 代码
- 热重载自动生效

### Rust 开发
- 修改 `src-tauri/src/` 下的 Rust 代码
- 需要重新编译（开发模式下自动）

### Python 开发
- 修改 `python/` 下的 Python 代码
- 需要重启应用才能生效

## 常见问题

### 1. Tauri 编译失败
- 确保 Rust 已正确安装：`rustc --version`
- 清理并重新编译：`cd src-tauri && cargo clean && cd ..`

### 2. Python 模块导入错误
- 确保已安装所有依赖：`pip install -r python/requirements.txt`
- 检查 Python 路径是否正确

### 3. API Key 未配置
- 检查 `python/.env` 文件是否存在
- 确保 API Key 格式正确

## 下一步

1. 实现 PDF 解析功能（MinerU）
2. 实现视频处理功能（yt-dlp）
3. 实现音频转写功能（Faster-Whisper）
4. 完善 AI Agent 意图识别
5. 实现数据库持久化
6. 添加向量数据库支持（ChromaDB）

## 贡献

欢迎提交 Issue 和 Pull Request！

