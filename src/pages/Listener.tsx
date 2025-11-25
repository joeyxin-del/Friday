import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { open } from "@tauri-apps/api/dialog";
import { Upload, Headphones, Loader } from "lucide-react";

export default function Listener() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFileSelect = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "音频文件",
            extensions: ["mp3", "wav", "m4a", "flac", "ogg"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setLoading(true);
        try {
          const resource = await invoke("process_audio", { path: selected });
          setResult(JSON.stringify(resource, null, 2));
        } catch (error) {
          console.error("Failed to process audio:", error);
          alert("音频处理失败: " + error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">音频转写</h1>
        <p className="text-gray-600">导入音频文件，自动转写并识别说话人</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <button
          onClick={handleFileSelect}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>处理中...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              <span>选择音频文件</span>
            </>
          )}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Headphones className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">转写结果</h3>
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


