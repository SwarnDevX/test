"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, LayoutTemplate, ArrowRight } from "lucide-react";
import { BUILT_IN_TEMPLATES } from "@/lib/templates";
import toast from "react-hot-toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (project: { id: string; title: string; updatedAt: string; createdAt: string }) => void;
}

export function NewProjectModal({ open, onClose, onCreate }: Props) {
  const [step, setStep] = useState<"choose" | "name">("choose");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setStep("choose");
    setSelectedTemplate(null);
    setTitle("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleCreate() {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setLoading(true);
    try {
      const templateData = selectedTemplate
        ? BUILT_IN_TEMPLATES.find((t) => t.id === selectedTemplate)?.resumeData
        : undefined;

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          templateId: selectedTemplate,
          resumeData: templateData,
        }),
      });

      if (!res.ok) {
        toast.error("Failed to create resume");
        return;
      }

      const project = await res.json();
      toast.success("Resume created!");
      handleClose();
      onCreate(project);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-2xl rounded-2xl p-6 z-10"
            style={{ background: "rgba(10,10,30,0.98)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {step === "choose" ? "Choose a starting point" : "Name your resume"}
              </h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center glass-hover text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {step === "choose" ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {/* Blank option */}
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className={`flex flex-col items-start gap-3 p-4 rounded-xl text-left transition-all ${
                      selectedTemplate === null
                        ? "border-indigo-500/50"
                        : "border-white/[0.08] hover:border-white/20"
                    }`}
                    style={{
                      background: selectedTemplate === null ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${selectedTemplate === null ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <FileText className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Blank</p>
                      <p className="text-xs text-slate-500">Start from scratch</p>
                    </div>
                  </button>

                  {BUILT_IN_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className="flex flex-col items-start gap-3 p-4 rounded-xl text-left transition-all"
                      style={{
                        background: selectedTemplate === t.id ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedTemplate === t.id ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.06)" }}>
                        {t.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white leading-tight">{t.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{t.profession}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep("name")} className="btn-primary w-full justify-center">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {selectedTemplate && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <LayoutTemplate className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm text-indigo-300">
                        Template: {BUILT_IN_TEMPLATES.find((t) => t.id === selectedTemplate)?.name}
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium text-slate-400 mb-1.5 block">Resume title</label>
                    <input
                      type="text"
                      className="input-glass"
                      placeholder="e.g. Software Engineer @ Google"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep("choose")} className="btn-ghost flex-1 justify-center">
                    Back
                  </button>
                  <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1 justify-center">
                    {loading ? "Creating…" : "Create resume"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
