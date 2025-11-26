"""
PDF 处理主模块
"""
import sys
import uuid
from typing import Dict, Any, Callable, Optional
from pathlib import Path
from datetime import datetime
import fitz  # PyMuPDF
from friday_core.logger import setup_logger
from friday_core.config import Config

logger = setup_logger(__name__)


def _extract_text_from_pdf(pdf_path: str, progress_callback: Optional[Callable[[int, int], None]] = None) -> str:
    """
    从 PDF 提取文本内容
    
    Args:
        pdf_path: PDF 文件路径
        progress_callback: 进度回调函数 (current_page, total_pages)
    
    Returns:
        提取的文本内容
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    text_parts = []
    
    for page_num in range(total_pages):
        page = doc[page_num]
        text = page.get_text()
        text_parts.append(f"## 第 {page_num + 1} 页\n\n{text}\n\n")
        
        # 调用进度回调
        if progress_callback:
            progress_callback(page_num + 1, total_pages)
    
    doc.close()
    return "\n".join(text_parts)


def _extract_images_from_pdf(pdf_path: str, output_dir: Path, progress_callback: Optional[Callable[[int, int], None]] = None) -> list:
    """
    从 PDF 提取图片
    
    Args:
        pdf_path: PDF 文件路径
        output_dir: 图片输出目录
        progress_callback: 进度回调函数
    
    Returns:
        提取的图片路径列表
    """
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    image_paths = []
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for page_num in range(total_pages):
        page = doc[page_num]
        image_list = page.get_images()
        
        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            # 保存图片
            image_filename = f"page_{page_num + 1}_img_{img_index + 1}.{image_ext}"
            image_path = output_dir / image_filename
            with open(image_path, "wb") as img_file:
                img_file.write(image_bytes)
            
            image_paths.append(str(image_path))
        
        if progress_callback:
            progress_callback(page_num + 1, total_pages)
    
    doc.close()
    return image_paths


async def parse_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    解析 PDF 文件
    1. 版面分析（基础版本：逐页提取）
    2. 文本抽取
    3. 图表提取
    4. 生成 Markdown
    5. 保存到 Library
    
    Args:
        pdf_path: PDF 文件路径
        progress_callback: 进度回调函数 (stage, current, total)
            stage: "text" | "images" | "markdown"
            current: 当前进度
            total: 总进度
    """
    logger.info(f"Parsing PDF: {pdf_path}")
    logger.info(f"PDF path type: {type(pdf_path)}, length: {len(pdf_path) if isinstance(pdf_path, str) else 'N/A'}")
    
    # 确保路径是字符串类型
    if not isinstance(pdf_path, str):
        pdf_path = str(pdf_path)
    
    # 规范化路径（处理反斜杠和正斜杠）
    pdf_path = pdf_path.replace('/', '\\') if '\\' in pdf_path else pdf_path
    
    pdf_path_obj = Path(pdf_path)
    logger.info(f"Resolved path: {pdf_path_obj}")
    logger.info(f"Path exists: {pdf_path_obj.exists()}")
    logger.info(f"Path is absolute: {pdf_path_obj.is_absolute()}")
    
    if not pdf_path_obj.exists():
        # 提供更详细的错误信息
        error_msg = f"PDF file not found: {pdf_path}\n"
        error_msg += f"Resolved path: {pdf_path_obj}\n"
        error_msg += f"Absolute path: {pdf_path_obj.absolute()}\n"
        error_msg += f"Parent directory exists: {pdf_path_obj.parent.exists() if pdf_path_obj.parent else False}"
        raise FileNotFoundError(error_msg)
    
    # 生成资源 ID
    resource_id = str(uuid.uuid4())
    title = pdf_path_obj.stem
    
    # 创建输出目录
    Config.ensure_directories()
    library_path = Path(Config.LIBRARY_PATH)
    resource_dir = library_path / resource_id
    resource_dir.mkdir(parents=True, exist_ok=True)
    
    assets_dir = resource_dir / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. 提取文本
    logger.info("Extracting text from PDF...")
    print("PROGRESS:text:0:正在提取文本...", file=sys.stderr, flush=True)
    
    def text_progress(current: int, total: int):
        progress = int((current / total) * 40)  # 文本提取占 40%
        print(f"PROGRESS:text:{progress}:正在提取文本 ({current}/{total} 页)...", file=sys.stderr, flush=True)
    
    text_content = _extract_text_from_pdf(pdf_path, text_progress)
    
    # 2. 提取图片
    logger.info("Extracting images from PDF...")
    print("PROGRESS:images:40:正在提取图片...", file=sys.stderr, flush=True)
    
    def image_progress(current: int, total: int):
        progress = 40 + int((current / total) * 30)  # 图片提取占 30%
        print(f"PROGRESS:images:{progress}:正在提取图片 ({current}/{total} 页)...", file=sys.stderr, flush=True)
    
    image_paths = _extract_images_from_pdf(pdf_path, assets_dir, image_progress)
    
    # 3. 生成 Markdown
    logger.info("Generating Markdown...")
    print("PROGRESS:markdown:70:正在生成 Markdown...", file=sys.stderr, flush=True)
    
    # 构建 Markdown 内容
    markdown_content = f"# {title}\n\n"
    markdown_content += f"**来源**: {pdf_path}\n\n"
    markdown_content += f"**处理时间**: {datetime.now().isoformat()}\n\n"
    markdown_content += "---\n\n"
    
    # 添加文本内容
    markdown_content += text_content
    
    # 添加图片引用
    if image_paths:
        markdown_content += "\n## 提取的图片\n\n"
        for img_path in image_paths:
            img_name = Path(img_path).name
            markdown_content += f"![{img_name}](assets/{img_name})\n\n"
    
    # 保存 Markdown 文件
    md_path = resource_dir / f"{title}.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    
    print("PROGRESS:complete:100:PDF 解析完成", file=sys.stderr, flush=True)
    
    logger.info(f"PDF parsing completed: {resource_id}")
    
    # 返回资源信息
    return {
        "id": resource_id,
        "type": "pdf",
        "title": title,
        "source": pdf_path,
        "md_path": str(md_path),
        "assets": [str(p) for p in image_paths],
        "vector_index": None,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
    }


