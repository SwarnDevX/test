import { Link } from "react-router-dom";
import { Bug, BarChart3, Activity } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link to="/" className="flex items-center gap-2 text-lg font-bold text-emerald-400 hover:text-emerald-300 transition">
              <Bug size={22} />
              <span>Self-Healing Platform</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition">
                <BarChart3 size={15} /> Dashboard
              </Link>
              <div className="flex items-center gap-1.5 text-sm text-emerald-400">
                <Activity size={14} className="animate-pulse-dot" /> Live
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}

