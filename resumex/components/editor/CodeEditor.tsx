"use client";

import dynamic from "next/dynamic";
import { Upload } from "lucide-react";
import { useRef } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Props {
  code: string;
  onChange: (code: string) => void;
}

export function CodeEditor({ code, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onChange(text);
    };
    reader.readAsText(file);
  }

  return (
    <div className="h-full flex flex-col">
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] flex-shrink-0"
        style={{ background: "rgba(5,5,20,0.8)" }}
      >
        <span className="text-xs text-slate-500 font-mono">main.tex</span>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-md glass-hover"
        >
          <Upload className="w-3 h-3" />
          Upload .tex
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".tex,.txt"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language="latex"
          theme="vs-dark"
          value={code}
          onChange={(v) => onChange(v ?? "")}
          options={{
            fontSize: 13,
            fontFamily: "JetBrains Mono, Fira Code, monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            wordWrap: "on",
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: "gutter",
            smoothScrolling: true,
            cursorSmoothCaretAnimation: "on",
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}
