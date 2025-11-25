@echo off
REM Conda 环境设置脚本（Windows）

echo 创建 Friday Conda 环境...
conda env create -f environment.yml

echo 环境创建完成！
echo.
echo 请运行以下命令激活环境：
echo   conda activate friday
echo.
echo 如果需要 GPU 支持，激活环境后运行：
echo   conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia

pause


