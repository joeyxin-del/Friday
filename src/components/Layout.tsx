import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  BookOpen, 
  Video, 
  Headphones, 
  MessageSquare, 
  Settings,
  Library as LibraryIcon
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: "/", icon: LibraryIcon, label: "资源库" },
    { path: "/reader", icon: BookOpen, label: "PDF 阅读器" },
    { path: "/watcher", icon: Video, label: "视频处理" },
    { path: "/listener", icon: Headphones, label: "音频转写" },
    { path: "/command", icon: MessageSquare, label: "命令模式" },
    { path: "/settings", icon: Settings, label: "设置" },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 侧边栏 */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Friday</h1>
          <p className="text-sm text-gray-500 mt-1">科研向本地 AI 助手</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}


