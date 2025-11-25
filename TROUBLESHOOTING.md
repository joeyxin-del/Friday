# Friday 项目故障排除指南（Troubleshooting Guide）

本文档记录了 Friday 项目开发过程中遇到的常见问题及其解决方案。

---

## 1. Cargo 网络连接问题

### 问题描述

在运行 `npm run tauri:dev` 时，Cargo 无法下载 Rust 依赖包，出现以下错误：

```
error: failed to get `serde` as a dependency of package `friday v0.1.0`
Caused by:
  failed to fetch `https://github.com/rust-lang/crates.io-index`
Caused by:
  [35] SSL connect error (Recv failure: Connection was reset)
```

或者：

```
fatal: unable to access 'https://github.com/rust-lang/crates.io-index/': 
OpenSSL SSL_connect: Connection was reset in connection to github.com:443
```

**症状：**
- Cargo 尝试连接 `127.0.0.1:7890`（代理端口）但连接失败
- 或直接访问 GitHub/crates.io 时 SSL 连接被重置
- 所有镜像源（清华、中科大、阿里云）都无法连接

### 解决方案

#### 步骤 1：配置 Git 使用代理

如果系统已配置代理（如 Clash、V2Ray 在 7890 端口），配置 Git 使用代理：

```powershell
# 配置 HTTP 代理
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 临时禁用 SSL 验证（解决 SSL 连接问题）
git config --global http.sslVerify false

# 使用 HTTP/1.1 协议（提高兼容性）
git config --global http.version HTTP/1.1
```

#### 步骤 2：配置 Cargo 使用 Git CLI

编辑或创建 `%USERPROFILE%\.cargo\config.toml`：

```toml
# Cargo 配置文件

# 使用 Git CLI 来获取（而不是内置 Git）
[net]
git-fetch-with-cli = true

# 使用官方源（通过代理访问）
[source.crates-io]
registry = "https://github.com/rust-lang/crates.io-index"
```

#### 步骤 3：确保代理服务器运行

确保你的代理软件（Clash、V2Ray 等）正在运行并监听 7890 端口：

```powershell
# 测试代理是否可用
Test-NetConnection -ComputerName 127.0.0.1 -Port 7890
```

#### 步骤 4：手动更新依赖

如果自动更新失败，可以手动更新：

```powershell
cd src-tauri
$env:CARGO_NET_GIT_FETCH_WITH_CLI="true"
cargo update
```

### 验证

配置完成后，运行：

```powershell
npm run tauri:dev
```

应该能看到 Cargo 开始下载依赖：

```
Updating crates.io index
From https://github.com/rust-lang/crates.io-index
 * [new ref] -> origin/HEAD
 Locking 419 packages to latest compatible versions
```

### 备用方案：使用国内镜像源

如果代理不可用，可以尝试使用国内镜像源。编辑 `%USERPROFILE%\.cargo\config.toml`：

```toml
[net]
git-fetch-with-cli = true

# 使用中科大镜像
[source.crates-io]
replace-with = 'ustc'

[source.ustc]
registry = "https://mirrors.ustc.edu.cn/crates.io-index"
```

或使用 RustCC 镜像：

```toml
[net]
git-fetch-with-cli = true

[source.crates-io]
replace-with = 'rustcc'

[source.rustcc]
registry = "https://code.aliyun.com/rustcc/crates.io-index.git"
```

---

## 2. Node.js 版本过低

### 问题描述

运行 `npm run tauri:dev` 时出现：

```
SyntaxError: Invalid regular expression flags
    at Loader.moduleStrategy (node:internal/modules/esm/translators:147:18)
```

**原因：** Node.js 版本过低（如 v15.14.0），不支持 Vite 5.x 所需的正则表达式特性。

### 解决方案

升级 Node.js 到 18+ 版本。

#### 方法一：使用 nvm-windows（推荐）

1. 下载安装 nvm-windows：https://github.com/coreybutler/nvm-windows/releases
2. 安装 Node.js 18 LTS：

```powershell
nvm install 18.20.4
nvm use 18.20.4
```

3. 验证：

```powershell
node --version  # 应该显示 v18.x.x
```

#### 方法二：直接安装

访问 https://nodejs.org/ 下载并安装 LTS 版本。

---

## 3. Rust/Cargo 未安装

### 问题描述

运行 `npm run tauri:dev` 时出现：

```
Error failed to get cargo metadata: program not found
```

### 解决方案

安装 Rust：

1. 访问 https://rustup.rs/
2. 下载并运行 `rustup-init.exe`
3. 按回车使用默认选项
4. **重启 PowerShell** 使环境变量生效
5. 验证：

```powershell
rustc --version
cargo --version
```

---

## 4. Conda 环境依赖安装问题

### 问题描述

安装 Python 依赖时，某些包（如 `av`、`faster-whisper`）编译失败。

### 解决方案

#### 临时方案：注释掉有问题的依赖

编辑 `python/requirements.txt`，暂时注释掉需要编译的包：

```txt
# faster-whisper==0.10.0  # 需要 FFmpeg，Windows 上编译较复杂
# torch==2.1.0  # 如果不需要音频功能，可以暂时注释
# torchaudio==2.1.0
```

#### 完整安装（如果需要音频功能）

1. 安装 FFmpeg：https://ffmpeg.org/download.html
2. 安装 Visual Studio Build Tools（包含 C++ 编译器）
3. 重新安装依赖：

```powershell
conda activate friday
cd python
pip install -r requirements.txt
```

---

## 5. Tauri 插件依赖错误

### 问题描述

运行 `npm install` 时出现：

```
npm ERR! notarget No matching version found for @tauri-apps/plugin-dialog@^1.0.0
```

### 解决方案

在 Tauri v1 中，dialog、fs、shell 等功能已内置在 `@tauri-apps/api` 中，不需要单独的插件包。

从 `package.json` 中移除这些不存在的插件依赖：

```json
{
  "dependencies": {
    "@tauri-apps/api": "^1.5.1",
    // 移除以下行：
    // "@tauri-apps/plugin-shell": "^1.0.0",
    // "@tauri-apps/plugin-fs": "^1.0.0",
    // "@tauri-apps/plugin-dialog": "^1.0.0"
  }
}
```

代码中使用 `@tauri-apps/api/dialog` 等导入是正确的，无需修改。

---

## 6. 首次编译时间过长

### 问题描述

首次运行 `npm run tauri:dev` 时，编译过程需要很长时间（10-30 分钟）。

### 说明

这是正常现象，因为需要：
1. 下载 Rust 标准库和工具链
2. 编译 Tauri 及其所有依赖（约 419 个包）
3. 编译项目代码

### 解决方案

**耐心等待**。后续编译会快很多，因为只有修改过的文件需要重新编译。

---

## 7. 环境变量配置

### 问题描述

Python 模块无法找到 API Keys 或配置。

### 解决方案

1. 复制环境变量示例文件：

```powershell
copy python\.env.example python\.env
```

2. 编辑 `python\.env`，填入你的 API Keys：

```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CLAUDE_API_KEY=your_claude_api_key_here
```

---

## 常见命令速查

### 检查环境

```powershell
# 检查 Node.js 版本
node --version

# 检查 Rust 版本
rustc --version
cargo --version

# 检查 Python 环境
conda activate friday
python --version

# 检查 Git 配置
git config --global --list
```

### 清理和重建

```powershell
# 清理 Rust 编译缓存
cd src-tauri
cargo clean

# 清理 Node.js 依赖
Remove-Item -Recurse -Force node_modules
npm install

# 清理 Python 缓存
cd python
Remove-Item -Recurse -Force __pycache__
```

---

## 获取帮助

如果以上方案都无法解决问题，请：

1. 检查错误日志的完整输出
2. 确认所有前置要求已满足（Node.js 18+、Rust、Python 3.10+）
3. 查看 Tauri 官方文档：https://tauri.app/
4. 查看项目 GitHub Issues

---

## 8. 缺少 Tauri 图标文件

### 问题描述

运行 `npm run tauri:dev` 时出现：

```
`icons/icon.ico` not found; required for generating a Windows Resource file during tauri-build
```

**原因：** Tauri 需要图标文件来构建应用，但项目中没有这些文件。

### 解决方案

#### 方法一：使用 Tauri CLI 生成图标（推荐）

1. 准备一个 1024x1024 像素的 PNG 图标文件（带透明背景）

2. 使用 Tauri CLI 生成所有需要的图标：

```powershell
cd src-tauri
npx @tauri-apps/cli icon path/to/your/icon.png
```

或者如果图标文件名为 `app-icon.png` 且在 `src-tauri` 目录下：

```powershell
cd src-tauri
npx @tauri-apps/cli icon app-icon.png
```

这会自动生成所有平台需要的图标：
- `icons/icon.ico` (Windows)
- `icons/icon.icns` (macOS)
- `icons/32x32.png`, `icons/128x128.png`, `icons/128x128@2x.png` (各种尺寸)

#### 方法二：创建占位图标

如果没有设计好的图标，可以创建一个简单的占位图标：

1. 使用 Python 创建占位图标（需要 Pillow）：

```python
from PIL import Image, ImageDraw, ImageFont

size = 1024
img = Image.new('RGBA', (size, size), (59, 130, 246, 255))  # 蓝色背景
draw = ImageDraw.Draw(img)

# 绘制文字或图形
# ... 绘制代码 ...

img.save("app-icon.png", "PNG")
```

2. 然后使用 Tauri CLI 生成图标：

```powershell
cd src-tauri
npx @tauri-apps/cli icon app-icon.png
```

#### 方法三：从网上下载临时图标

可以从图标网站（如 [Flaticon](https://www.flaticon.com/)）下载一个 1024x1024 的图标，然后使用 Tauri CLI 生成。

### 验证

生成后，检查图标文件是否存在：

```powershell
Get-ChildItem src-tauri\icons
```

应该能看到 `icon.ico`、`icon.icns` 和各种 PNG 文件。

---

**最后更新：** 2024-01-01

