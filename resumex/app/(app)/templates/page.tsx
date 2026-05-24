"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BUILT_IN_TEMPLATES } from "@/lib/templates";
import { ArrowRight, Tag } from "lucide-react";
import toast from "react-hot-toast";

export default function TemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function useTemplate(templateId: string) {
    setLoading(templateId);
    const template = BUILT_IN_TEMPLATES.find((t) => t.id === templateId)!;
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${template.name} Resume`,
          templateId,
          resumeData: template.resumeData,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const project = await res.json();
      toast.success("Template loaded!");
      router.push(`/editor/${project.id}`);
    } catch {
      toast.error("Failed to use template");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Templates</h1>
        <p className="text-sm text-slate-400 mt-1">
          Start with a professionally crafted template for your industry.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {BUILT_IN_TEMPLATES.map((template, i) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="glass rounded-2xl p-6 flex flex-col gap-4 group"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {template.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-white mb-0.5">{template.name}</h3>
                <p className="text-xs text-slate-500">{template.profession}</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">{template.description}</p>

            <div className="flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-slate-400"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2 mt-auto pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => useTemplate(template.id)}
                disabled={loading === template.id}
                className="btn-primary flex-1 justify-center text-xs py-2"
              >
                {loading === template.id ? "Loading…" : "Use template"}
                {loading !== template.id && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
