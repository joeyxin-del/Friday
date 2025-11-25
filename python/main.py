#!/usr/bin/env python3
"""
Friday Python Sidecar - 主入口
处理来自 Tauri 的 JSON RPC 请求
"""
import sys
import json
import asyncio
from typing import Dict, Any

from friday_core.router import Router
from friday_core.logger import setup_logger

logger = setup_logger(__name__)


async def handle_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """处理 JSON RPC 请求"""
    try:
        cmd = request.get("cmd")
        payload = request.get("payload", {})

        if not cmd:
            return {"error": "Missing 'cmd' field"}

        router = Router()
        result = await router.route(cmd, payload)

        return {"result": result}

    except Exception as e:
        logger.error(f"Error handling request: {e}", exc_info=True)
        return {"error": str(e)}


def main():
    """主函数 - 从 stdin 读取 JSON，处理并输出结果"""
    try:
        # 从 stdin 读取 JSON
        input_data = sys.stdin.read()
        request = json.loads(input_data)

        # 处理请求
        result = asyncio.run(handle_request(request))

        # 输出结果到 stdout
        print(json.dumps(result, ensure_ascii=False))

    except json.JSONDecodeError as e:
        error_result = {"error": f"Invalid JSON: {e}"}
        print(json.dumps(error_result))
        sys.exit(1)
    except Exception as e:
        error_result = {"error": str(e)}
        print(json.dumps(error_result))
        sys.exit(1)


if __name__ == "__main__":
    main()


