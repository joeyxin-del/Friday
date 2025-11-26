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

        # 记录请求信息（用于调试）
        logger.debug(f"Command: {cmd}, Payload keys: {list(payload.keys())}")
        if "path" in payload:
            logger.debug(f"Path value: {payload['path']}, type: {type(payload['path'])}")

        router = Router()
        result = await router.route(cmd, payload)

        return {"result": result}

    except Exception as e:
        logger.error(f"Error handling request: {e}", exc_info=True)
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Traceback: {error_details}")
        return {"error": str(e)}


def main():
    """主函数 - 从 stdin 读取 JSON，处理并输出结果"""
    try:
        # 从 stdin 读取 JSON（确保使用 UTF-8 编码）
        # 在 Windows 上，stdin 可能是二进制模式，需要正确处理
        import io
        if hasattr(sys.stdin, 'buffer'):
            # 二进制模式，需要解码
            input_bytes = sys.stdin.buffer.read()
            input_data = input_bytes.decode('utf-8')
        else:
            # 文本模式
            input_data = sys.stdin.read()
        
        request = json.loads(input_data)

        # 处理请求
        result = asyncio.run(handle_request(request))

        # 输出结果到 stdout（确保使用 UTF-8 编码）
        output_json = json.dumps(result, ensure_ascii=False)
        if hasattr(sys.stdout, 'buffer'):
            # 二进制模式，需要编码
            sys.stdout.buffer.write(output_json.encode('utf-8'))
            sys.stdout.buffer.write(b'\n')
            sys.stdout.buffer.flush()
        else:
            # 文本模式
            print(output_json, flush=True)

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


