"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BUILT_IN_TEMPLATES } from "@/lib/templates";
import { ArrowRight } from "lucide-react";

export function TemplatesShowcase() {
  return (
    <section id="templates" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="section-title mb-3"
          >
            Pre-built templates
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-white"
          >
            Made for your <span className="gradient-text">profession</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-slate-400 max-w-xl mx-auto"
          >
            Each template is carefully crafted with real industry-relevant content, keywords, and structure.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BUILT_IN_TEMPLATES.map((template, i) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-hover rounded-2xl p-6 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: `linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))`,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {template.icon}
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {template.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded-full text-slate-400"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="font-semibold text-white mb-1">{template.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{template.description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs text-indigo-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Use template <ArrowRight className="w-3 h-3" />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/register" className="btn-primary px-8 py-3">
            Start with a template
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
