"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, FileText, Download, Eye } from "lucide-react";
import type { ResumeData } from "@/types";
import { ResumeHTMLPreview } from "./ResumeHTMLPreview";

interface Props {
  pdfUrl: string | null;
  compiling: boolean;
  resumeData: ResumeData;
  onCompile: () => void;
  onDownload: () => void;
}

type Tab = "preview" | "pdf";

export function ResumePreview({ pdfUrl, compiling, resumeData, onCompile, onDownload }: Props) {
  const [tab, setTab] = useState<Tab>("preview");
  const prevPdfUrl = useRef<string | null>(null);

  // Stay on "Live" tab while compiling (html2canvas needs the element visible),
  // then auto-switch to PDF tab once the PDF is ready.
  useEffect(() => {
    if (pdfUrl && pdfUrl !== prevPdfUrl.current) {
      prevPdfUrl.current = pdfUrl;
      setTab("pdf");
    }
  }, [pdfUrl]);

  const handleCompile = () => {
    // The HTML preview is always in the DOM (display:none when on PDF tab),
    // so html2canvas can always find it. Just call onCompile directly.
    onCompile();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/[0.06] flex-shrink-0"
        style={{ background: "rgba(5,5,20,0.9)" }}
      >
        {/* Tab toggle */}
        <div
          className="flex items-center p-0.5 rounded-lg gap-0.5"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={() => setTab("preview")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={
              tab === "preview"
                ? { background: "rgba(99,102,241,0.25)", color: "#fff" }
                : { color: "#94a3b8" }
            }
          >
            <Eye className="w-3 h-3" />
            Live
          </button>
          <button
            onClick={() => setTab("pdf")}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
            style={
              tab === "pdf"
                ? { background: "rgba(99,102,241,0.25)", color: "#fff" }
                : { color: "#94a3b8" }
            }
          >
            <FileText className="w-3 h-3" />
            PDF
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCompile}
            disabled={compiling}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-all disabled:opacity-50"
            style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            {compiling ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileText className="w-3 h-3" />}
            {compiling ? "Generating…" : "Export PDF"}
          </button>
          {pdfUrl && (
            <button
              onClick={onDownload}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium text-emerald-300 transition-all"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.2)" }}
            >
              <Download className="w-3 h-3" />
              Save PDF
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto" style={{ background: "#e5e7eb" }}>
        {/* Live HTML preview — always rendered so html2canvas can capture it.
            When on the PDF tab, it's shifted off-screen (not display:none)
            so it retains layout and html2canvas can still read it. */}
        <div
          className="p-4 min-h-full"
          style={
            tab !== "preview"
              ? { position: "absolute", top: "-9999px", left: "-9999px", width: "680px", pointerEvents: "none" }
              : {}
          }
        >
          <div
            className="mx-auto shadow-2xl"
            style={{
              background: "#fff",
              maxWidth: "680px",
              minHeight: "960px",
              borderRadius: "2px",
            }}
          >
            <ResumeHTMLPreview data={resumeData} />
          </div>
        </div>

        {tab === "pdf" && (
          /* PDF tab */
          <div className="h-full">
            {compiling ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
                >
                  <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Generating PDF…</p>
                  <p className="text-slate-400 text-xs mt-1">
                    Rendering resume to PDF — takes just a moment
                  </p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                key={pdfUrl}
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full border-0"
                style={{ height: "100%" }}
                title="Resume PDF"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <FileText className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">No PDF yet</p>
                  <p className="text-slate-400 text-xs mt-1 max-w-[200px]">
                    Click <strong className="text-indigo-400">Export PDF</strong> to generate a PDF from the live preview
                  </p>
                </div>
                <button onClick={handleCompile} className="btn-primary text-xs px-4 py-2">
                  Export PDF
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
