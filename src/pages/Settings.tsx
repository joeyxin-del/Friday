import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Save } from "lucide-react";

interface Settings {
  api_keys: Record<string, string>;
  library_path: string;
  log_level: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<Settings>({
    api_keys: {},
    library_path: "library",
    log_level: "info",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await invoke<Settings>("get_settings");
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await invoke("update_settings", { settings });
      alert("设置已保存");
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("保存失败: " + error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">设置</h1>
        <p className="text-gray-600">配置 API Key 和系统参数</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <input
            type="password"
            value={settings.api_keys.openai || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                api_keys: { ...settings.api_keys, openai: e.target.value },
              })
            }
            placeholder="sk-..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gemini API Key
          </label>
          <input
            type="password"
            value={settings.api_keys.gemini || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                api_keys: { ...settings.api_keys, gemini: e.target.value },
              })
            }
            placeholder="AIza..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Claude API Key
          </label>
          <input
            type="password"
            value={settings.api_keys.claude || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                api_keys: { ...settings.api_keys, claude: e.target.value },
              })
            }
            placeholder="sk-ant-..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            资源库路径
          </label>
          <input
            type="text"
            value={settings.library_path}
            onChange={(e) =>
              setSettings({ ...settings, library_path: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日志级别
          </label>
          <select
            value={settings.log_level}
            onChange={(e) =>
              setSettings({ ...settings, log_level: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? "保存中..." : "保存设置"}</span>
        </button>
      </div>
    </div>
  );
}


