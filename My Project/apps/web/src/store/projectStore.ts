import { create } from 'zustand';

export interface GenerationOutput {
  landingPage: {
    headline: string;
    subheadline: string;
    heroDescription: string;
    features: { title: string; description: string; icon: string }[];
    cta: { primary: string; secondary: string };
    testimonials: { name: string; role: string; quote: string }[];
    pricing: { plan: string; price: string; features: string[] }[];
    faq: { question: string; answer: string }[];
  };
  marketingCopy: {
    tagline: string;
    valueProposition: string;
    emailSubject: string;
    emailBody: string;
    twitterBio: string;
    adCopy: { platform: string; headline: string; body: string }[];
    productHuntTagline: string;
  };
  seoKeywords: {
    primaryKeywords: string[];
    longTailKeywords: string[];
    metaTitle: string;
    metaDescription: string;
    contentTopics: string[];
    competitorKeywords: string[];
  };
  growthStrategies: {
    channels: { name: string; description: string; priority: string; estimatedROI: string; actionItems: string[] }[];
    northStarMetric: string;
    week1Actions: string[];
    month1Goals: string[];
    kpis: string[];
    retentionStrategies: string[];
  };
}

interface ProjectState {
  currentProjectId: string | null;
  currentIdea: string;
  output: GenerationOutput | null;
  isGenerating: boolean;
  setGenerating: (v: boolean) => void;
  setResult: (projectId: string, idea: string, output: GenerationOutput) => void;
  clear: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProjectId: null,
  currentIdea: '',
  output: null,
  isGenerating: false,
  setGenerating: (v) => set({ isGenerating: v }),
  setResult: (projectId, idea, output) =>
    set({ currentProjectId: projectId, currentIdea: idea, output, isGenerating: false }),
  clear: () => set({ currentProjectId: null, currentIdea: '', output: null }),
}));

