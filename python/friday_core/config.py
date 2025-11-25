"""
配置文件管理
"""
import os
from pathlib import Path
from typing import Dict, Optional
from dotenv import load_dotenv

# 加载 .env 文件
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path)


class Config:
    """配置类"""

    # API Keys
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    CLAUDE_API_KEY: Optional[str] = os.getenv("CLAUDE_API_KEY")

    # 数据库路径
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "python/data/friday.db")
    CHROMADB_PATH: str = os.getenv("CHROMADB_PATH", "python/data/chroma_db")

    # Library 路径
    LIBRARY_PATH: str = os.getenv("LIBRARY_PATH", "library")

    # 日志级别
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @classmethod
    def get_api_key(cls, provider: str) -> Optional[str]:
        """获取 API Key"""
        key_map = {
            "openai": cls.OPENAI_API_KEY,
            "gemini": cls.GEMINI_API_KEY,
            "claude": cls.CLAUDE_API_KEY,
        }
        return key_map.get(provider.lower())

    @classmethod
    def ensure_directories(cls):
        """确保必要的目录存在"""
        Path(cls.DATABASE_PATH).parent.mkdir(parents=True, exist_ok=True)
        Path(cls.CHROMADB_PATH).mkdir(parents=True, exist_ok=True)
        Path(cls.LIBRARY_PATH).mkdir(parents=True, exist_ok=True)


