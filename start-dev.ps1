# Friday 开发环境启动脚本
# 确保 conda 环境已激活并设置正确的环境变量

Write-Host "正在启动 Friday 开发环境..." -ForegroundColor Green

# 检查 conda 是否可用
$condaAvailable = Get-Command conda -ErrorAction SilentlyContinue
if (-not $condaAvailable) {
    Write-Host "错误: 未找到 conda 命令。请确保 Anaconda/Miniconda 已安装并添加到 PATH。" -ForegroundColor Red
    exit 1
}

# 激活 conda 环境
Write-Host "激活 conda 环境: friday" -ForegroundColor Yellow
conda activate friday

if ($LASTEXITCODE -ne 0) {
    Write-Host "错误: 无法激活 conda 环境 'friday'。请确保环境已创建。" -ForegroundColor Red
    Write-Host "提示: 运行 'conda env create -f python/environment.yml'" -ForegroundColor Yellow
    exit 1
}

# 检查 Python 是否可用
$pythonPath = (Get-Command python).Source
Write-Host "Python 路径: $pythonPath" -ForegroundColor Cyan

# 检查 PyMuPDF 是否安装
Write-Host "检查 Python 依赖..." -ForegroundColor Yellow
$pymupdfInstalled = python -c "import fitz; print('OK')" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "警告: PyMuPDF 未安装。正在安装..." -ForegroundColor Yellow
    pip install pymupdf
}

# 设置环境变量（确保 Tauri 应用可以访问）
$env:CONDA_PREFIX = (conda info --envs | Select-String "friday" | ForEach-Object { $_.ToString().Split()[0] })
if (-not $env:CONDA_PREFIX) {
    $env:CONDA_PREFIX = (Get-Command python).Source | Split-Path -Parent
}

Write-Host "CONDA_PREFIX: $env:CONDA_PREFIX" -ForegroundColor Cyan

# 启动 Tauri 开发服务器
Write-Host "`n启动 Tauri 开发服务器..." -ForegroundColor Green
npm run tauri:dev

