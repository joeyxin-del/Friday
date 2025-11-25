import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Send, Loader } from "lucide-react";

export default function Command() {
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!command.trim()) {
      alert("请输入命令");
      return;
    }

    setLoading(true);
    try {
      const task = await invoke("execute_command", { command: command.trim() });
      setResult(JSON.stringify(task, null, 2));
    } catch (error) {
      console.error("Failed to execute command:", error);
      alert("命令执行失败: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">命令模式</h1>
        <p className="text-gray-600">使用自然语言指令 Friday 处理任务</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            输入命令
          </label>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="例如：帮我解析这个 PDF 文件..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px]"
            disabled={loading}
          />
        </div>

        <button
          onClick={handleExecute}
          disabled={loading || !command.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span>执行中...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>执行命令</span>
            </>
          )}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">执行结果</h3>
            <pre className="text-sm text-gray-700 overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}


