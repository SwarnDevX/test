"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Save, Download, Eye, Code2, Wand2, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { generateLatex } from "@/lib/latex-generator";
import type { ResumeData, EditorMode } from "@/types";
import { SectionsPanel } from "./SectionsPanel";
import { VisualEditor } from "./VisualEditor";
import { CodeEditor } from "./CodeEditor";
import { ResumePreview } from "./ResumePreview";

interface Props {
  projectId: string;
  initialTitle: string;
  initialResumeData: ResumeData;
  initialLatexCode: string;
}

export function EditorLayout({ projectId, initialTitle, initialResumeData, initialLatexCode }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [latexCode, setLatexCode] = useState(initialLatexCode);
  const [mode, setMode] = useState<EditorMode>("visual");
  const [activeSection, setActiveSection] = useState<string>("personalInfo");
  const [saving, setSaving] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-generate latex when resumeData changes in visual mode
  useEffect(() => {
    if (mode === "visual") {
      const generated = generateLatex(resumeData);
      setLatexCode(generated);
    }
  }, [resumeData, mode]);

  // Auto-save
  const scheduleSave = useCallback(
    (data: Partial<{ resumeData: ResumeData; latexCode: string; title: string }>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveProject(data);
      }, 1500);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId]
  );

  function updateResumeData(updater: (prev: ResumeData) => ResumeData) {
    setResumeData((prev) => {
      const next = updater(prev);
      scheduleSave({ resumeData: next });
      return next;
    });
  }

  function handleLatexChange(code: string) {
    setLatexCode(code);
    scheduleSave({ latexCode: code });
  }

  async function saveProject(data: Partial<{ resumeData: ResumeData; latexCode: string; title: string }>) {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title ?? title,
          latexCode: data.latexCode ?? latexCode,
          resumeData: data.resumeData ?? resumeData,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSave() {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, latexCode, resumeData }),
      });
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleCompile() {
    setCompiling(true);
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfUrl(null);

    try {
      // Dynamically import to avoid SSR issues
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const element = document.getElementById("resume-preview-html");
      if (!element) {
        toast.error("Preview not visible — switch to the Live tab first");
        return;
      }

      // Render at 2× scale for crisp text
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.97);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = pdf.internal.pageSize.getWidth();   // 210 mm
      const pageH = pdf.internal.pageSize.getHeight();  // 297 mm

      // Scale image to fit page width
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = pageW / imgW;
      const scaledH = imgH * ratio;

      // Slice into pages
      let yOffset = 0;
      while (yOffset < scaledH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, -yOffset, pageW, scaledH);
        yOffset += pageH;
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success("PDF generated!");
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed");
    } finally {
      setCompiling(false);
    }
  }

  function handleDownload() {
    if (!pdfUrl) {
      toast("Compile first to generate a PDF", { icon: "ℹ️" });
      return;
    }
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`;
    a.click();
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ marginLeft: 0 }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.07] flex-shrink-0 z-30"
        style={{ background: "rgba(7,7,26,0.97)", backdropFilter: "blur(20px)" }}
      >
        <Link href="/dashboard" className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm mr-1">
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:block">Back</span>
        </Link>

        <div className="h-4 w-px bg-white/[0.08]" />

        <input
          className="flex-1 bg-transparent text-white text-sm font-medium outline-none min-w-0 max-w-xs"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave({ title: e.target.value });
          }}
          placeholder="Untitled resume"
        />

        <div className="flex items-center gap-1 ml-auto">
          {/* Mode toggle */}
          <div
            className="flex items-center p-1 rounded-xl gap-0.5"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={() => setMode("visual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === "visual"
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              style={mode === "visual" ? { background: "rgba(99,102,241,0.25)" } : {}}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Visual
            </button>
            <button
              onClick={() => setMode("code")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                mode === "code"
                  ? "text-white"
                  : "text-slate-400 hover:text-white"
              }`}
              style={mode === "code" ? { background: "rgba(99,102,241,0.25)" } : {}}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
            </button>
          </div>

          <button
            onClick={() => setShowPreview((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all glass-hover ${showPreview ? "text-cyan-400" : "text-slate-400"}`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Preview</span>
          </button>

          <button onClick={handleManualSave} disabled={saving} className="btn-ghost py-2 text-xs">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:block">{saving ? "Saving…" : "Save"}</span>
          </button>

          <button onClick={handleCompile} disabled={compiling} className="btn-ghost py-2 text-xs">
            {compiling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5 text-violet-400" />}
            <span className="hidden sm:block">{compiling ? "Generating…" : "Export PDF"}</span>
          </button>

          <button onClick={handleDownload} className="btn-primary py-2 text-xs">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Download PDF</span>
          </button>
        </div>
      </div>

      {/* Editor body */}
      <div className="flex flex-1 min-h-0">
        {/* Sections sidebar */}
        {mode === "visual" && (
          <SectionsPanel
            resumeData={resumeData}
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            onUpdateSectionOrder={(order) =>
              updateResumeData((prev) => ({ ...prev, sectionOrder: order }))
            }
          />
        )}

        {/* Main editor area */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <motion.div
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            {mode === "visual" ? (
              <VisualEditor
                resumeData={resumeData}
                activeSection={activeSection}
                onUpdate={updateResumeData}
              />
            ) : (
              <CodeEditor code={latexCode} onChange={handleLatexChange} />
            )}
          </motion.div>
        </div>

        {/* PDF preview */}
        {showPreview && (
          <div
            className="w-[42%] flex-shrink-0 border-l border-white/[0.07]"
            style={{ background: "rgba(4,4,15,0.6)" }}
          >
            <ResumePreview
              pdfUrl={pdfUrl}
              onCompile={handleCompile}
              compiling={compiling}
              resumeData={resumeData}
              onDownload={handleDownload}
            />
          </div>
        )}
      </div>
    </div>
  );
}
