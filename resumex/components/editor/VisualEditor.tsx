"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ResumeData, SectionKey } from "@/types";
import { PersonalInfoSection } from "./sections/PersonalInfoSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import { EducationSection } from "./sections/EducationSection";
import { SkillsSection } from "./sections/SkillsSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { SummarySection } from "./sections/SummarySection";
import { CertificationsSection } from "./sections/CertificationsSection";
import { PublicationsSection } from "./sections/PublicationsSection";

interface Props {
  resumeData: ResumeData;
  activeSection: string;
  onUpdate: (updater: (prev: ResumeData) => ResumeData) => void;
}

export function VisualEditor({ resumeData, activeSection, onUpdate }: Props) {
  const renderSection = () => {
    switch (activeSection as SectionKey) {
      case "personalInfo":
        return (
          <PersonalInfoSection
            data={resumeData.personalInfo}
            onChange={(personalInfo) => onUpdate((prev) => ({ ...prev, personalInfo }))}
          />
        );
      case "summary":
        return (
          <SummarySection
            value={resumeData.summary}
            onChange={(summary) => onUpdate((prev) => ({ ...prev, summary }))}
          />
        );
      case "experience":
        return (
          <ExperienceSection
            entries={resumeData.experience}
            onChange={(experience) => onUpdate((prev) => ({ ...prev, experience }))}
          />
        );
      case "education":
        return (
          <EducationSection
            entries={resumeData.education}
            onChange={(education) => onUpdate((prev) => ({ ...prev, education }))}
          />
        );
      case "skills":
        return (
          <SkillsSection
            data={resumeData.skills}
            onChange={(skills) => onUpdate((prev) => ({ ...prev, skills }))}
          />
        );
      case "projects":
        return (
          <ProjectsSection
            entries={resumeData.projects}
            onChange={(projects) => onUpdate((prev) => ({ ...prev, projects }))}
          />
        );
      case "certifications":
        return (
          <CertificationsSection
            entries={resumeData.certifications}
            onChange={(certifications) => onUpdate((prev) => ({ ...prev, certifications }))}
          />
        );
      case "publications":
        return (
          <PublicationsSection
            entries={resumeData.publications ?? []}
            onChange={(publications) => onUpdate((prev) => ({ ...prev, publications }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className="p-6 max-w-2xl"
        >
          {renderSection()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
