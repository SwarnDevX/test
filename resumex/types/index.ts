export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  position: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string[];
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  courses?: string[];
}

export interface SkillsData {
  [category: string]: string[];
}

export interface ProjectEntry {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github?: string;
  bullets: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface PublicationEntry {
  id: string;
  title: string;
  venue: string;
  date: string;
  url?: string;
}

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: SkillsData;
  projects: ProjectEntry[];
  certifications: CertificationEntry[];
  publications?: PublicationEntry[];
  sectionOrder: SectionKey[];
}

export type SectionKey =
  | "personalInfo"
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "publications";

export interface Template {
  id: string;
  name: string;
  profession: string;
  description: string;
  icon: string;
  color: string;
  tags: string[];
  resumeData: ResumeData;
}

export interface Project {
  id: string;
  title: string;
  latexCode: string;
  resumeData: ResumeData;
  templateId?: string;
  profession?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EditorMode = "visual" | "code";
export type PreviewMode = "split" | "preview" | "editor";
