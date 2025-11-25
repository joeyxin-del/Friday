# 001 - Tauri 框架介绍

## 1. 什么是 Tauri？

Tauri 是一个用于构建桌面应用程序的框架，它允许开发者使用 Web 技术（HTML、CSS、JavaScript/TypeScript）来创建跨平台的桌面应用。

### 1.1 核心特点

- **轻量级**：生成的应用程序体积小，通常只有几 MB
- **安全性**：内置安全沙箱，严格控制系统资源访问
- **跨平台**：支持 Windows、macOS 和 Linux
- **性能优秀**：使用系统原生 WebView，性能接近原生应用
- **Rust 后端**：使用 Rust 作为后端，提供强大的系统级功能

### 1.2 与 Electron 的对比

| 特性 | Tauri | Electron |
|------|-------|----------|
| 应用体积 | 几 MB | 几十到上百 MB |
| 内存占用 | 低 | 较高 |
| 安全性 | 内置安全沙箱 | 需要额外配置 |
| 后端语言 | Rust | Node.js |
| 性能 | 优秀 | 良好 |
| 生态系统 | 较新，快速发展 | 成熟，生态丰富 |

## 2. Tauri 架构

### 2.1 架构组成

```
┌─────────────────────────────────────┐
│         Frontend (Web)              │
│  React / Vue / Svelte / 原生 HTML   │
└──────────────┬──────────────────────┘
               │
               │ IPC (Inter-Process Communication)
               │
┌──────────────▼──────────────────────┐
│      Tauri Core (Rust)               │
│  ┌────────────────────────────────┐  │
│  │  Window Management            │  │
│  │  File System Access           │  │
│  │  System APIs                  │  │
│  │  Security Sandbox             │  │
│  └────────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │
               │
┌──────────────▼──────────────────────┐
│    System WebView                   │
│  Windows: WebView2                  │
│  macOS: WKWebView                   │
│  Linux: WebKitGTK                   │
└─────────────────────────────────────┘
```

### 2.2 核心组件

1. **前端层（Frontend）**
   - 使用任何 Web 框架（React、Vue、Svelte 等）
   - 或使用原生 HTML/CSS/JavaScript
   - 运行在系统原生 WebView 中

2. **Tauri Core（Rust 后端）**
   - 窗口管理
   - 文件系统访问
   - 系统 API 调用
   - 安全沙箱控制

3. **系统 WebView**
   - Windows: WebView2（基于 Chromium）
   - macOS: WKWebView（系统自带）
   - Linux: WebKitGTK

## 3. Tauri 的优势

### 3.1 性能优势

- **小体积**：应用体积通常只有 3-5 MB（相比 Electron 的 50-100 MB）
- **低内存**：内存占用远低于 Electron
- **快速启动**：启动速度快，响应迅速

### 3.2 安全优势

- **最小权限原则**：默认情况下，前端无法访问系统资源
- **显式权限配置**：需要在 `tauri.conf.json` 中明确声明需要的权限
- **安全沙箱**：前端代码运行在受限环境中

### 3.3 开发体验

- **熟悉的 Web 技术栈**：可以使用现有的 Web 开发技能
- **强大的 Rust 后端**：可以调用系统 API，处理复杂逻辑
- **热重载**：开发时支持热重载，提高开发效率
- **类型安全**：TypeScript + Rust 提供完整的类型安全

## 4. Tauri 应用场景

### 4.1 适合的场景

- **工具类应用**：需要系统集成的工具
- **数据管理应用**：需要本地文件访问的应用
- **跨平台桌面应用**：需要在多个平台运行的应用
- **资源受限环境**：对应用体积和内存有要求的场景
- **安全敏感应用**：需要严格控制权限的应用

### 4.2 不适合的场景

- **需要大量 Node.js 生态**：Tauri 使用 Rust，不是 Node.js
- **需要复杂浏览器特性**：WebView 可能不支持某些最新 Web API
- **需要大量第三方 Electron 插件**：生态系统相对较新

## 5. Tauri 开发流程

### 5.1 项目结构

```
my-tauri-app/
├── src/                    # 前端代码（React/Vue 等）
│   ├── components/
│   ├── pages/
│   └── main.tsx
├── src-tauri/              # Rust 后端代码
│   ├── src/
│   │   ├── main.rs        # Rust 入口
│   │   └── commands.rs    # Tauri 命令
│   ├── Cargo.toml         # Rust 依赖
│   └── tauri.conf.json    # Tauri 配置
├── package.json           # 前端依赖
└── vite.config.ts         # 构建配置
```

### 5.2 开发步骤

1. **创建项目**
   ```bash
   npm create tauri-app
   ```

2. **开发前端**
   - 在 `src/` 目录下开发前端代码
   - 使用任何 Web 框架

3. **开发后端（可选）**
   - 在 `src-tauri/src/` 下编写 Rust 代码
   - 定义 Tauri 命令供前端调用

4. **配置权限**
   - 在 `tauri.conf.json` 中配置需要的权限
   - 例如：文件系统访问、窗口控制等

5. **运行开发**
   ```bash
   npm run tauri dev
   ```

6. **构建应用**
   ```bash
   npm run tauri build
   ```

## 6. Tauri 命令系统

### 6.1 什么是 Tauri 命令？

Tauri 命令是前端调用后端 Rust 函数的桥梁。前端通过 `invoke` API 调用 Rust 函数。

### 6.2 定义命令（Rust 端）

```rust
// src-tauri/src/main.rs
use tauri::command;

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 6.3 调用命令（前端）

```typescript
// src/main.tsx
import { invoke } from '@tauri-apps/api/tauri';

async function greet() {
  const message = await invoke<string>('greet', { name: 'World' });
  console.log(message); // "Hello, World! You've been greeted from Rust!"
}
```

## 7. Tauri 配置

### 7.1 主要配置文件

**tauri.conf.json** - Tauri 应用配置

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:1420",
    "distDir": "../dist"
  },
  "package": {
    "productName": "My App",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "shell": {
        "open": true
      },
      "fs": {
        "readFile": true,
        "writeFile": true
      }
    },
    "windows": [
      {
        "title": "My App",
        "width": 1200,
        "height": 800
      }
    ]
  }
}
```

### 7.2 权限配置

Tauri 使用白名单机制，默认所有权限都是关闭的，需要显式开启：

```json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "readFile": true,      // 允许读取文件
        "writeFile": true,     // 允许写入文件
        "readDir": true        // 允许读取目录
      },
      "dialog": {
        "open": true           // 允许打开文件对话框
      }
    }
  }
}
```

## 8. Tauri 与系统集成

### 8.1 文件系统访问

```typescript
import { readTextFile, writeTextFile } from '@tauri-apps/api/fs';

// 读取文件
const content = await readTextFile('path/to/file.txt');

// 写入文件
await writeTextFile('path/to/file.txt', 'Hello, Tauri!');
```

### 8.2 窗口控制

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

// 最小化
await appWindow.minimize();

// 最大化
await appWindow.maximize();

// 关闭
await appWindow.close();
```

### 8.3 系统对话框

```typescript
import { open } from '@tauri-apps/api/dialog';

// 打开文件选择对话框
const selected = await open({
  multiple: false,
  filters: [{
    name: 'Image',
    extensions: ['png', 'jpg']
  }]
});
```

## 9. Tauri 版本

### 9.1 Tauri v1（当前项目使用）

- 稳定版本
- 使用 `@tauri-apps/api` v1.x
- 配置在 `tauri.conf.json`
- 成熟的生态系统

### 9.2 Tauri v2（最新版本）

- 性能进一步优化
- 新的插件系统
- 更好的类型安全
- 使用 `@tauri-apps/api` v2.x

## 10. 学习资源

### 10.1 官方资源

- **官方网站**：https://tauri.app/
- **文档**：https://tauri.app/v1/guides/
- **API 参考**：https://tauri.app/v1/api/
- **GitHub**：https://github.com/tauri-apps/tauri

### 10.2 社区资源

- **Discord**：Tauri 官方 Discord 社区
- **Reddit**：r/tauri
- **示例项目**：https://github.com/tauri-apps/tauri/tree/dev/examples

### 10.3 推荐学习路径

1. **基础**：了解 Tauri 架构和基本概念
2. **实践**：创建一个简单的 Hello World 应用
3. **进阶**：学习 Tauri 命令系统和权限配置
4. **深入**：学习 Rust 后端开发和系统集成
5. **实战**：开发完整的桌面应用

## 11. 常见问题

### 11.1 为什么选择 Tauri 而不是 Electron？

- **体积小**：应用体积小 10-20 倍
- **性能好**：内存占用低，启动快
- **安全性高**：内置安全沙箱
- **现代化**：使用 Rust 和现代 Web 技术

### 11.2 需要学习 Rust 吗？

- **基础使用**：不需要，可以使用默认的 Rust 代码
- **高级功能**：需要，如果要实现复杂的系统集成
- **推荐**：至少了解 Rust 基础语法

### 11.3 Tauri 支持哪些前端框架？

支持所有现代前端框架：
- React
- Vue
- Svelte
- Angular
- 原生 HTML/CSS/JavaScript
- 任何可以构建为静态文件的框架

## 12. 总结

Tauri 是一个现代化的桌面应用开发框架，它结合了 Web 技术的灵活性和 Rust 的性能与安全性。对于需要开发跨平台桌面应用的开发者来说，Tauri 是一个优秀的选择，特别是在对应用体积、性能和安全性有要求的场景下。

### 关键要点

- ✅ 使用 Web 技术开发，学习曲线平缓
- ✅ 应用体积小，性能优秀
- ✅ 安全性高，权限控制严格
- ✅ 跨平台支持，一次开发多平台运行
- ✅ 活跃的社区和持续的发展

---

**文档编号**：001  
**主题**：Tauri 框架介绍  
**创建日期**：2024-01-01  
**适用版本**：Tauri v1.x

