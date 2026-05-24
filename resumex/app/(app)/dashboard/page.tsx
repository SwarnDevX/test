"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Trash2, ExternalLink, Copy, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { NewProjectModal } from "@/components/dashboard/NewProjectModal";
import { formatDate } from "@/lib/utils";

interface ProjectSummary {
  id: string;
  title: string;
  profession?: string;
  updatedAt: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const res = await fetch("/api/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this resume? This cannot be undone.")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Deleted");
    }
  }

  async function duplicateProject(id: string) {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) return;
    const project = await res.json();

    const newRes = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${project.title} (copy)`,
        resumeData: project.resumeData,
      }),
    });
    if (newRes.ok) {
      const newProject = await newRes.json();
      setProjects((prev) => [newProject, ...prev]);
      toast.success("Duplicated");
    }
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">My Resumes</h1>
          <p className="text-sm text-slate-400 mt-1">{projects.length} resume{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Resume
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl glass animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <FileText className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No resumes yet</h3>
          <p className="text-slate-400 text-sm mb-6 max-w-xs">
            Create your first resume from a template or start from scratch.
          </p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create resume
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {projects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="group glass-hover rounded-2xl p-5 cursor-pointer flex flex-col gap-4"
                onClick={() => router.push(`/editor/${project.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
                  >
                    <FileText className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div
                    className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => router.push(`/editor/${project.id}`)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center glass-hover text-slate-400 hover:text-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => duplicateProject(project.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center glass-hover text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center glass-hover text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white text-sm leading-snug mb-1 line-clamp-2">
                    {project.title}
                  </h3>
                  {project.profession && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-indigo-300"
                      style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.15)" }}
                    >
                      {project.profession}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-auto">
                  <Clock className="w-3 h-3" />
                  Updated {formatDate(project.updatedAt)}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <NewProjectModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreate={(project) => {
          setProjects((prev) => [project, ...prev]);
          router.push(`/editor/${project.id}`);
        }}
      />
    </div>
  );
}
