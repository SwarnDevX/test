"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, language, readOnly }: CodeEditorProps) {
  const monacoLang = MONACO_LANG_MAP[language] ?? language;

  return (
    <MonacoEditor
      height="100%"
      language={monacoLang}
      value={value}
      theme="vs-dark"
      onChange={(v) => onChange(v ?? "")}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        readOnly: readOnly ?? false,
        automaticLayout: true,
        tabSize: 4,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        lineNumbers: "on",
        renderLineHighlight: "line",
        scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
      }}
    />
  );
}

const MONACO_LANG_MAP: Record<string, string> = {
  java:       "java",
  python:     "python",
  cpp:        "cpp",
  c:          "c",
  javascript: "javascript",
  go:         "go",
  rust:       "rust",
};
