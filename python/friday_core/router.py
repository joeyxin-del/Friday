"""
资源路由器 - 根据命令路由到对应模块
"""
from typing import Dict, Any
from friday_core.logger import setup_logger

logger = setup_logger(__name__)


class Router:
    """命令路由器"""

    def __init__(self):
        self.handlers = {}
        self._register_handlers()

    def _register_handlers(self):
        """注册所有命令处理器"""
        # PDF 模块
        self.handlers["parse_pdf"] = self._handle_parse_pdf

        # 视频模块
        self.handlers["process_video"] = self._handle_process_video

        # 音频模块
        self.handlers["process_audio"] = self._handle_process_audio

        # AI Agent
        self.handlers["execute_command"] = self._handle_execute_command

    async def route(self, cmd: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """路由命令到对应处理器"""
        handler = self.handlers.get(cmd)
        if not handler:
            raise ValueError(f"Unknown command: {cmd}")

        logger.info(f"Routing command: {cmd}")
        return await handler(payload)

    async def _handle_parse_pdf(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """处理 PDF 解析"""
        from friday_reader.main import parse_pdf
        path = payload.get("path")
        if not path:
            raise ValueError("Missing 'path' in payload")
        return await parse_pdf(path)

    async def _handle_process_video(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """处理视频"""
        from friday_watcher.main import process_video
        url = payload.get("url")
        if not url:
            raise ValueError("Missing 'url' in payload")
        return await process_video(url)

    async def _handle_process_audio(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """处理音频"""
        from friday_listener.main import process_audio
        path = payload.get("path")
        if not path:
            raise ValueError("Missing 'path' in payload")
        return await process_audio(path)

    async def _handle_execute_command(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """执行自然语言命令"""
        from friday_core.agent import execute_command
        command = payload.get("command")
        if not command:
            raise ValueError("Missing 'command' in payload")
        return await execute_command(command)


