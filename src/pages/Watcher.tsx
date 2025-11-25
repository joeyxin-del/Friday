import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Video, Loader } from "lucide-react";

export default function Watcher() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!url.trim()) {
      alert("请输入视频链接");
      return;
    }

    setLoading(true);
    try {
      const resource = await invoke("process_video", { url: url.trim() });
      setResult(JSON.stringify(resource, null, 2));
    } catch (error) {
      console.error("Failed to process video:", error);
      alert("视频处理失败: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">视频处理</h1>
        <p className="text-gray-600">输入 YouTube 或 Bilibili 链接，获取字幕和总结</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            视频链接
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleProcess}
          disabled={loading || !url.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>处理中...</span>
            </>
          ) : (
            <>
              <Video className="w-5 h-5" />
              <span>开始处理</span>
            </>
          )}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">处理结果</h3>
            <pre className="text-sm text-gray-700 overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}


