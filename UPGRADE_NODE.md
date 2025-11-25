# 升级 Node.js 指南

当前 Node.js 版本：v15.14.0（太旧）
Vite 5.x 需要：Node.js 18+

## 方法一：使用 nvm-windows（推荐）

### 1. 安装 nvm-windows
- 访问：https://github.com/coreybutler/nvm-windows/releases
- 下载最新版本的 `nvm-setup.exe`
- 运行安装程序

### 2. 安装 Node.js 18 LTS
```powershell
# 安装 Node.js 18 LTS
nvm install 18.20.4

# 或安装最新 LTS 版本
nvm install 20.11.0

# 使用该版本
nvm use 18.20.4

# 验证
node --version
npm --version
```

### 3. 设置为默认版本（可选）
```powershell
nvm alias default 18.20.4
```

## 方法二：直接安装 Node.js

1. 访问：https://nodejs.org/
2. 下载 LTS 版本（推荐 18.x 或 20.x）
3. 运行安装程序
4. 重启 PowerShell

## 安装后

```powershell
# 验证版本
node --version  # 应该是 v18.x.x 或 v20.x.x

# 重新安装依赖（可能需要）
npm install

# 运行项目
npm run tauri:dev
```

## 注意事项

- 如果使用 nvm-windows，需要关闭并重新打开 PowerShell
- 如果直接安装，可能需要重启 PowerShell 或电脑
- 升级后可能需要重新运行 `npm install`

