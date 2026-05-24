import Link from "next/link";
import { FileText } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #06b6d4)" }}>
            <FileText className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-white">
            Resume<span className="gradient-text">X</span>
          </span>
        </Link>
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} ResumeX. Build beautiful resumes.
        </p>
        <div className="flex gap-6 text-sm text-slate-500">
          <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
        </div>
      </div>
    </footer>
  );
}
