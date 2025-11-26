# PDF 阅读器功能状态

## 当前实现状态

### ✅ 已实现

1. **前端界面**
   - PDF 文件选择对话框
   - 进度条显示（实时更新）
   - 错误提示
   - 成功结果展示

2. **后端框架**
   - Rust 端命令接口
   - Python 端处理逻辑框架
   - 进度事件系统

3. **PDF 解析功能**
   - 文本提取（使用 PyMuPDF）
   - 图片提取
   - Markdown 生成
   - 资源管理

### ⚠️ 已知问题

1. **Python 路径问题**
   - Tauri 应用运行时可能找不到 conda 环境中的 Python
   - 已添加自动检测 conda 环境的逻辑
   - 如果仍然失败，需要手动设置环境变量

2. **错误处理**
   - 已改进错误信息显示
   - 现在会显示更详细的错误信息

3. **PDF 转换质量问题** ⚠️ **严重问题**
   
   **当前实现方式**：
   - 使用 PyMuPDF 的 `page.get_text()` 方法
   - 这是最基础的文本提取，丢失了大量结构信息
   
   **存在的问题**：
   - ❌ **表格结构丢失**：表格被拆散成普通文本，无法识别行列结构
   - ❌ **数学公式无法识别**：公式被当作普通文本，无法转换为 LaTeX 格式
   - ❌ **文本顺序错乱**：双栏布局时，文本按提取顺序排列，而非阅读顺序
   - ❌ **布局信息丢失**：无法区分标题、正文、引用等不同元素
   - ❌ **页眉页脚未过滤**：包含页眉页脚等非正文内容
   - ❌ **文本不连贯**：段落被错误分割，影响阅读体验
   
   **影响**：
   - 转换后的 Markdown 文件质量低，无法直接使用
   - 特别是学术论文（双栏布局、大量公式和表格）转换效果很差
   - 需要大量手动编辑才能使用

## 使用说明

### 前置条件

1. **激活 Conda 环境**
   ```powershell
   conda activate friday
   ```

2. **确保依赖已安装**
   ```powershell
   pip list | Select-String "pymupdf"
   ```

3. **设置环境变量（如果需要）**
   ```powershell
   $env:CONDA_PREFIX = "D:\anaconda3\envs\friday"
   ```

### 测试步骤

1. 运行应用：`npm run tauri:dev`
2. 点击"选择 PDF 文件"
3. 选择一个 PDF 文件
4. 观察进度条更新
5. 查看处理结果

## 故障排除

如果遇到 "Python error"：

1. **检查 Python 是否可用**
   ```powershell
   python --version
   python -c "import fitz; print('OK')"
   ```

2. **检查环境变量**
   ```powershell
   $env:CONDA_PREFIX
   $env:CONDA_DEFAULT_ENV
   ```

3. **手动指定 Python 路径**
   修改 `src-tauri/src/python_bridge.rs`，硬编码 Python 路径：
   ```rust
   let python_cmd = "D:\\anaconda3\\envs\\friday\\python.exe".to_string();
   ```

4. **查看详细错误**
   检查应用控制台或日志文件

## 输出位置

处理后的文件保存在项目根目录的 `library` 文件夹中：

```
library/
└── {resource_id}/          # 每个 PDF 对应一个唯一 ID 的文件夹
    ├── {title}.md          # 转换后的 Markdown 文件
    └── assets/             # 提取的图片
        ├── page_X_img_Y.png
        └── ...
```

**示例路径：**
- Markdown 文件：`library/7f7b81f0-a63d-4f38-9db9-ebae2c0f5c17/Zhang 等 - 2023 - Variational Positive-incentive Noise How Noise Be.md`
- 图片文件：`library/7f7b81f0-a63d-4f38-9db9-ebae2c0f5c17/assets/page_3_img_1.png`

**配置：**
- 默认路径：`library`（项目根目录）
- 可通过环境变量 `LIBRARY_PATH` 修改（在 `python/.env` 中设置）

## Marker 项目分析

参考项目：[Marker](https://github.com/datalab-to/marker) - 高质量 PDF 转 Markdown 工具

### Marker 的核心优势

1. **深度学习模型管道**：
   - 使用 **Surya** 进行布局检测和阅读顺序识别
   - 使用 **Texify** 进行数学公式识别（转换为 LaTeX）
   - 使用启发式规则清理和格式化文本块
   - 可选使用 LLM（Gemini）提高质量

2. **性能表现**（基准测试）：
   - 科学论文：96.67% heuristic score, 4.35 LLM score
   - 表格提取：0.816 分（使用 LLM 后 0.907）
   - 平均处理时间：2.84 秒/页（H100 GPU）

3. **处理流程**：
   ```
   提取文本/OCR → 布局检测 → 阅读顺序识别 → 
   文本块清理 → 公式识别 → 表格识别 → 
   (可选) LLM 优化 → 组合并后处理
   ```

### Marker 的技术栈

- **布局检测**：Surya OCR（深度学习模型）
- **公式识别**：Texify（数学公式转 LaTeX）
- **表格提取**：专门的表格检测和转换算法
- **质量提升**：可选使用 Gemini API 进行后处理

## 改进计划

### 阶段一：快速改进（使用现有库） ⏱️ 1-2 周

**目标**：在不引入深度学习模型的情况下，显著提升转换质量

1. **替换文本提取方法**
   - [ ] 使用 PyMuPDF 的高级 API（`get_text("dict")` 或 `get_text("blocks")`）
   - [ ] 根据文本块位置信息重新排序（解决双栏问题）
   - [ ] 识别并过滤页眉页脚

2. **集成 pdfplumber**
   - [ ] 添加 `pdfplumber` 依赖
   - [ ] 使用 `pdfplumber` 提取表格（`extract_tables()`）
   - [ ] 将表格转换为 Markdown 表格格式
   - [ ] 使用 `extract_text(layout=True)` 保持布局

3. **基础公式识别**
   - [ ] 使用 PyMuPDF 的 `get_text("html")` 获取结构化文本
   - [ ] 识别内嵌公式（简单模式匹配）
   - [ ] 或使用 OCR 识别公式区域

**预期效果**：
- 表格识别准确率：60-70%
- 文本顺序：基本正确（单栏/简单双栏）
- 公式：部分识别（内嵌公式）

### 阶段二：引入深度学习模型 ⏱️ 2-4 周

**目标**：达到接近 Marker 的质量水平

1. **集成 Surya OCR**
   - [ ] 安装 Surya 模型（布局检测 + OCR）
   - [ ] 实现布局检测功能
   - [ ] 实现阅读顺序识别
   - [ ] 处理复杂布局（多栏、表格、公式混合）

2. **集成 Texify**
   - [ ] 安装 Texify 模型
   - [ ] 识别数学公式区域
   - [ ] 转换为 LaTeX 格式
   - [ ] 嵌入到 Markdown 中

3. **表格提取优化**
   - [ ] 使用 Surya 检测表格区域
   - [ ] 使用专门的表格识别算法
   - [ ] 转换为 HTML 表格（然后转 Markdown）

**预期效果**：
- 表格识别准确率：80-90%
- 公式识别准确率：85-95%
- 文本顺序：完全正确
- 整体质量：接近 Marker 水平

### 阶段三：可选 LLM 优化 ⏱️ 1-2 周

**目标**：进一步提升质量，特别是复杂文档

1. **LLM 后处理**
   - [ ] 集成 Gemini API（或 OpenAI/Claude）
   - [ ] 使用 LLM 优化表格结构
   - [ ] 使用 LLM 修复文本连贯性
   - [ ] 使用 LLM 识别和格式化标题层级

2. **质量评估**
   - [ ] 添加质量评分机制
   - [ ] 对低质量转换自动启用 LLM 优化
   - [ ] 提供用户选择（是否使用 LLM）

**预期效果**：
- 表格识别准确率：90-95%
- 整体质量：达到或超过 Marker 水平

### 阶段四：性能优化 ⏱️ 1 周

1. **模型优化**
   - [ ] 模型量化（减少内存占用）
   - [ ] 批量处理优化
   - [ ] GPU/CPU 自动选择

2. **缓存机制**
   - [ ] 相同 PDF 的缓存
   - [ ] 模型结果缓存

## 技术选型建议

### 方案 A：完全集成 Marker（推荐用于快速验证）

**优点**：
- 质量最高，开箱即用
- 已有完整的模型管道

**缺点**：
- 依赖较多（需要 GPU 或大量 CPU 资源）
- 模型文件较大
- 需要适配到我们的架构

**实施**：
```python
# 使用 marker 作为库
from marker.convert import convert_single_pdf

result = convert_single_pdf(pdf_path)
```

### 方案 B：逐步改进（推荐用于生产）

**优点**：
- 可控性强，逐步提升
- 可以根据需求选择功能
- 资源占用可控

**缺点**：
- 开发周期较长
- 需要集成多个模型

**实施**：
1. 阶段一：快速改进（pdfplumber）
2. 阶段二：引入 Surya + Texify
3. 阶段三：可选 LLM 优化

### 方案 C：混合方案

**优点**：
- 平衡质量和资源占用
- 可以针对不同文档类型选择策略

**实施**：
- 简单文档：使用 pdfplumber
- 复杂文档（学术论文）：使用 Marker 或 Surya+Texify
- 用户可选择处理模式

### 方案 D：集成 DeepSeek-OCR ⭐ **新方案**

**参考**: [DeepSeek-OCR](https://github.com/deepseek-ai/DeepSeek-OCR) - 20.9k stars

**优点**：
- ✅ **一步到位**: 直接输出 Markdown，无需多步骤
- ✅ **质量高**: 基于大模型，质量应该很好
- ✅ **原生 PDF 支持**: 支持直接处理 PDF
- ✅ **表格和公式**: 支持表格识别和公式识别
- ✅ **架构兼容**: 完美匹配 Friday 的 Python Sidecar 架构

**缺点**：
- ⚠️ **GPU 必需**: 需要 NVIDIA GPU (CUDA 11.8+)，CPU 模式很慢
- ⚠️ **Python 3.12**: 需要 Python 3.12.9（Friday 当前是 3.10）
- ⚠️ **模型文件大**: 估计 10-20GB
- ⚠️ **依赖复杂**: 需要 PyTorch 2.6.0, vLLM/Transformers, flash-attn

**可行性**: ⭐⭐⭐⭐ (4/5) - **可以集成，但需要 GPU 支持**

**详细分析**: 参见 [DeepSeek-OCR 集成可行性分析](./DeepSeek_OCR_Integration_Analysis.md)

**推荐实施方式**:
- 作为**可选功能**集成（不影响现有实现）
- 使用**独立 conda 环境**（避免依赖冲突）
- 提供**降级方案**（无 GPU 时使用传统方法）
- **渐进式实施**（先基础功能，再优化）

## 下一步行动

### 立即行动（本周）

1. **评估资源需求**
   - [ ] 测试 Marker 在本地环境运行
   - [ ] 测试 DeepSeek-OCR 在本地环境运行
   - [ ] 评估 GPU/CPU 资源需求
   - [ ] 评估模型文件大小
   - [ ] 对比 Marker vs DeepSeek-OCR 的实际效果

2. **快速改进**
   - [ ] 实现 pdfplumber 集成
   - [ ] 改进表格提取
   - [ ] 改进文本排序

3. **制定详细技术方案**
   - [ ] 选择最终方案（A/B/C/D 或组合）
   - [ ] 制定详细的实施计划
   - [ ] 评估开发时间和资源
   - [ ] 决定是否集成 DeepSeek-OCR（需要 GPU 支持）

### 后续改进

- [ ] 添加更详细的错误日志
- [ ] 支持拖拽上传 PDF
- [ ] 添加 PDF 预览功能
- [ ] 支持批量处理
- [ ] 优化大文件处理性能
- [ ] 在 UI 中显示输出文件位置和打开文件功能
- [ ] 添加转换质量评估和报告

## FastAPI 解耦架构 ⭐ **推荐**

**问题**: 当前架构中，模型推理和主应用紧耦合，导致：
- 模型升级需要重启整个应用
- 无法独立扩展模型服务
- 无法远程部署模型（如 GPU 服务器）
- 多个模型需要共享同一进程

**解决方案**: 通过 FastAPI 实现解耦架构

**架构**:
```
Tauri → FastAPI Gateway → 模型推理服务（独立进程）
```

**优势**:
- ✅ **完全解耦**: 应用和模型服务独立运行
- ✅ **灵活部署**: 本地/远程/混合部署
- ✅ **易于扩展**: 可以轻松添加新模型
- ✅ **资源优化**: 模型服务可以独立管理 GPU 资源
- ✅ **多客户端**: 多个 Friday 实例可以共享模型服务

**详细设计**: 参见 [FastAPI 解耦架构设计](./FastAPI_Decoupling_Architecture.md)

**实施建议**:
1. **阶段一**: 实现 FastAPI Gateway + 基础模型服务框架
2. **阶段二**: 迁移现有 PyMuPDF 到模型服务
3. **阶段三**: 集成 DeepSeek-OCR 等新模型
4. **阶段四**: 优化和扩展（远程部署、负载均衡等）

