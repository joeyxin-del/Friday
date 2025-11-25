import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { Upload, FileText } from "lucide-react";

export default function Reader() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
        try {
          const resource = await invoke("parse_pdf", { path: selected });
          setResult(JSON.stringify(resource, null, 2));
        } catch (error) {
          console.error("Failed to parse PDF:", error);
          alert("PDF 解析失败: " + error);
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

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">处理结果</h3>
            </div>
            <pre className="text-sm text-gray-700 overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}


