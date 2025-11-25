import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { FileText, Video, Headphones, Trash2 } from "lucide-react";

interface Resource {
  id: string;
  type: string;
  title: string;
  source: string;
  md_path?: string;
  assets: string[];
  created_at: string;
}

export default function Library() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      setLoading(true);
      const data = await invoke<Resource[]>("get_resources");
      setResources(data);
    } catch (error) {
      console.error("Failed to load resources:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定要删除这个资源吗？")) {
      try {
        await invoke("delete_resource", { id });
        loadResources();
      } catch (error) {
        console.error("Failed to delete resource:", error);
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-6 h-6 text-red-500" />;
      case "video":
        return <Video className="w-6 h-6 text-blue-500" />;
      case "audio":
        return <Headphones className="w-6 h-6 text-green-500" />;
      default:
        return <FileText className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">资源库</h1>
        <p className="text-gray-600">管理您的 PDF、视频和音频资源</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">加载中...</p>
        </div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">暂无资源，请先导入文件</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getIcon(resource.type)}
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {resource.type.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2 truncate">
                {resource.source}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(resource.created_at).toLocaleDateString("zh-CN")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


