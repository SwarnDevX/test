"use client";

import { motion } from "framer-motion";
import { Wand2, Code2, LayoutTemplate, Download, RefreshCw, Sliders } from "lucide-react";

const FEATURES = [
  {
    icon: Wand2,
    title: "Visual editor",
    description:
      "Fill out simple forms for each section. ResumeX converts your input to perfect LaTeX — no syntax to learn.",
    color: "text-indigo-400",
    bg: "rgba(99,102,241,0.1)",
    border: "rgba(99,102,241,0.2)",
  },
  {
    icon: Code2,
    title: "Raw LaTeX editor",
    description:
      "Power users can switch to Monaco editor for full LaTeX control. Upload your own .tex file or start from scratch.",
    color: "text-cyan-400",
    bg: "rgba(6,182,212,0.1)",
    border: "rgba(6,182,212,0.2)",
  },
  {
    icon: LayoutTemplate,
    title: "Profession templates",
    description:
      "Pre-built templates for Software Engineers, ML Engineers, DevOps, Data Scientists, PMs, and more.",
    color: "text-violet-400",
    bg: "rgba(139,92,246,0.1)",
    border: "rgba(139,92,246,0.2)",
  },
  {
    icon: Download,
    title: "One-click PDF",
    description:
      "Compile and download your resume as a professional PDF. LaTeX-quality typesetting, every time.",
    color: "text-emerald-400",
    bg: "rgba(16,185,129,0.1)",
    border: "rgba(16,185,129,0.2)",
  },
  {
    icon: RefreshCw,
    title: "Live sync",
    description:
      "Visual changes instantly sync to the LaTeX code. Watch your resume code update as you type in the form.",
    color: "text-orange-400",
    bg: "rgba(251,146,60,0.1)",
    border: "rgba(251,146,60,0.2)",
  },
  {
    icon: Sliders,
    title: "Section management",
    description:
      "Reorder sections by dragging. Add or remove Experience, Projects, Certifications — your resume, your structure.",
    color: "text-pink-400",
    bg: "rgba(244,114,182,0.1)",
    border: "rgba(244,114,182,0.2)",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="section-title mb-3"
          >
            Everything you need
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white"
          >
            LaTeX made <span className="gradient-text">effortless</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-hover rounded-2xl p-6 group"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                style={{ background: feat.bg, border: `1px solid ${feat.border}` }}
              >
                <feat.icon className={`w-5 h-5 ${feat.color}`} />
              </div>
              <h3 className="font-semibold text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
