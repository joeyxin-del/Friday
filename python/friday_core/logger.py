"""
日志系统
"""
import logging
import sys
from pathlib import Path
from loguru import logger

# 移除默认 handler
logger.remove()

# 添加控制台输出
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level="INFO",
)

# 添加文件输出
log_dir = Path("python/logs")
log_dir.mkdir(parents=True, exist_ok=True)

logger.add(
    log_dir / "friday_{time:YYYY-MM-DD}.log",
    rotation="00:00",
    retention="30 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} - {message}",
    level="DEBUG",
)


def setup_logger(name: str):
    """设置 logger"""
    return logger.bind(name=name)


