"""
示例插件 - 展示如何创建 Friday 插件
"""
from typing import Dict, Any
from friday_core.logger import setup_logger

logger = setup_logger(__name__)


def friday_plugin(name: str):
    """插件装饰器"""
    def decorator(func):
        # 注册插件
        logger.info(f"Registering plugin: {name}")
        return func
    return decorator


@friday_plugin(name="example_plugin")
def run(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    插件主函数
    接收 payload，返回处理结果
    """
    logger.info(f"Example plugin executed with payload: {payload}")
    return {"message": "Example plugin executed successfully"}


