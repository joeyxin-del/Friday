import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/api/dialog";
import { Upload, FileText, CheckCircle, XCircle } from "lucide-react";

interface ProgressInfo {
  stage: string;
  progress: number;
  message: string;
}

export default function Reader() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 监听进度事件
    const unlisten = listen<ProgressInfo>("pdf-progress", (event) => {
      setProgress(event.payload);
      if (event.payload.stage === "错误") {
        setError(event.payload.message);
        setLoading(false);
      } else if (event.payload.stage === "完成") {
        setLoading(false);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "PDF",
            extensions: ["pdf"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setLoading(true);
        setProgress(null);
        setError(null);
        setResult(null);
        
        try {
          const resource = await invoke("parse_pdf", { path: selected });
          setResult(JSON.stringify(resource, null, 2));
        } catch (err) {
          console.error("Failed to parse PDF:", err);
          const errorMsg = err instanceof Error ? err.message : String(err);
          
          // 提供更友好的错误提示
          let friendlyError = "PDF 解析失败: " + errorMsg;
          if (errorMsg.includes("Python error") || errorMsg.includes("python")) {
            friendlyError += "\n\n提示：请确保：\n1. Conda 环境已激活 (conda activate friday)\n2. Python 依赖已安装 (pip install -r requirements.txt)\n3. PDF 文件路径正确";
          }
          
          setError(friendlyError);
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Failed to select file:", error);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF 阅读器</h1>
        <p className="text-gray-600">导入 PDF 文件并转换为结构化 Markdown</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <button
          onClick={handleFileSelect}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>处理中...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>选择 PDF 文件</span>
            </>
          )}
        </button>

        {/* 进度条 */}
        {progress && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 font-medium">{progress.stage}</span>
              <span className="text-gray-500">{progress.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{progress.message}</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* 成功提示 */}
        {result && !loading && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">处理完成</h3>
              </div>
              <p className="text-sm text-green-700">PDF 已成功转换为 Markdown</p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">处理结果</h3>
              </div>
              <pre className="text-sm text-gray-700 overflow-auto max-h-96">
                {result}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


