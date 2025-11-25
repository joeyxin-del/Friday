# 安装 Rust（Windows）

Tauri 需要 Rust 才能编译。请按照以下步骤安装：

## 方法一：使用 rustup（推荐）

1. **下载 rustup-init**
   - 访问：https://rustup.rs/
   - 或直接下载：https://win.rustup.rs/x86_64
   - 下载 `rustup-init.exe`

2. **运行安装程序**
   ```powershell
   # 双击运行 rustup-init.exe
   # 或使用命令行
   .\rustup-init.exe
   ```

3. **安装选项**
   - 按回车键使用默认选项（推荐）
   - 安装完成后，需要重启 PowerShell 或重新打开终端

4. **验证安装**
   ```powershell
   rustc --version
   cargo --version
   ```

## 方法二：使用 Chocolatey（如果已安装）

```powershell
choco install rust
```

## 方法三：使用 Scoop（如果已安装）

```powershell
scoop install rust
```

## 安装后

安装完成后，**请关闭并重新打开 PowerShell**，然后运行：

```powershell
cd E:\002project\013Friday
conda activate friday
npm run tauri:dev
```

## 注意事项

- Rust 安装会下载约 200MB 的文件
- 首次编译 Tauri 项目可能需要较长时间（10-30分钟），因为需要编译 Rust 标准库和依赖
- 确保网络连接正常


