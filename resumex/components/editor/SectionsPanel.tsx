"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, User, Briefcase, GraduationCap, Wrench, FolderOpen, Award, BookOpen, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeData, SectionKey } from "@/types";

const SECTION_META: Record<SectionKey, { label: string; icon: React.ElementType }> = {
  personalInfo: { label: "Personal Info", icon: User },
  summary: { label: "Summary", icon: AlignLeft },
  experience: { label: "Experience", icon: Briefcase },
  education: { label: "Education", icon: GraduationCap },
  skills: { label: "Skills", icon: Wrench },
  projects: { label: "Projects", icon: FolderOpen },
  certifications: { label: "Certifications", icon: Award },
  publications: { label: "Publications", icon: BookOpen },
};

interface Props {
  resumeData: ResumeData;
  activeSection: string;
  onSelectSection: (key: string) => void;
  onUpdateSectionOrder: (order: SectionKey[]) => void;
}

export function SectionsPanel({ resumeData, activeSection, onSelectSection, onUpdateSectionOrder }: Props) {
  const order = resumeData.sectionOrder ?? (Object.keys(SECTION_META) as SectionKey[]);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const newOrder = [...order];
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    onUpdateSectionOrder(newOrder);
  }

  return (
    <aside
      className="w-[180px] flex-shrink-0 flex flex-col py-4 px-2 overflow-y-auto border-r border-white/[0.06]"
      style={{ background: "rgba(5,5,20,0.8)" }}
    >
      <p className="section-title px-2 mb-3">Sections</p>

      {/* Personal info always first */}
      <button
        onClick={() => onSelectSection("personalInfo")}
        className={cn(
          "flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium w-full text-left mb-1 transition-all",
          activeSection === "personalInfo"
            ? "text-white"
            : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
        )}
        style={activeSection === "personalInfo" ? { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" } : {}}
      >
        <User className="w-3.5 h-3.5 flex-shrink-0" />
        Personal Info
      </button>

      <div className="h-px bg-white/[0.06] my-2" />

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-0.5">
              {order
                .filter((k) => k !== "personalInfo")
                .map((key, index) => {
                  const meta = SECTION_META[key];
                  if (!meta) return null;
                  const active = activeSection === key;
                  return (
                    <Draggable key={key} draggableId={key} index={index}>
                      {(prov, snapshot) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          className={cn(
                            "flex items-center gap-2 pl-1 pr-2 py-2 rounded-lg text-xs font-medium w-full transition-all group",
                            active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]",
                            snapshot.isDragging && "opacity-70"
                          )}
                          style={{
                            ...(active ? { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.2)" } : {}),
                            ...prov.draggableProps.style,
                          }}
                          onClick={() => onSelectSection(key)}
                        >
                          <div
                            {...prov.dragHandleProps}
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GripVertical className="w-3 h-3 text-slate-600" />
                          </div>
                          <meta.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          {meta.label}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </aside>
  );
}
