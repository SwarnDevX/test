import { z } from 'zod';

export const LandingPageSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  heroDescription: z.string(),
  features: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string(),
    })
  ),
  cta: z.object({
    primary: z.string(),
    secondary: z.string(),
  }),
  testimonials: z.array(
    z.object({
      name: z.string(),
      role: z.string(),
      quote: z.string(),
    })
  ),
  pricing: z.array(
    z.object({
      plan: z.string(),
      price: z.string(),
      features: z.array(z.string()),
    })
  ),
  faq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ),
});

export const MarketingCopySchema = z.object({
  tagline: z.string(),
  valueProposition: z.string(),
  emailSubject: z.string(),
  emailBody: z.string(),
  twitterBio: z.string(),
  adCopy: z.array(
    z.object({
      platform: z.string(),
      headline: z.string(),
      body: z.string(),
    })
  ),
  productHuntTagline: z.string(),
});

export const SEOKeywordsSchema = z.object({
  primaryKeywords: z.array(z.string()),
  longTailKeywords: z.array(z.string()),
  metaTitle: z.string(),
  metaDescription: z.string(),
  contentTopics: z.array(z.string()),
  competitorKeywords: z.array(z.string()),
});

export const GrowthStrategiesSchema = z.object({
  channels: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      estimatedROI: z.string(),
      actionItems: z.array(z.string()),
    })
  ),
  northStarMetric: z.string(),
  week1Actions: z.array(z.string()),
  month1Goals: z.array(z.string()),
  kpis: z.array(z.string()),
  retentionStrategies: z.array(z.string()),
});

export const GenerationOutputSchema = z.object({
  landingPage: LandingPageSchema,
  marketingCopy: MarketingCopySchema,
  seoKeywords: SEOKeywordsSchema,
  growthStrategies: GrowthStrategiesSchema,
});

export type LandingPage = z.infer<typeof LandingPageSchema>;
export type MarketingCopy = z.infer<typeof MarketingCopySchema>;
export type SEOKeywords = z.infer<typeof SEOKeywordsSchema>;
export type GrowthStrategies = z.infer<typeof GrowthStrategiesSchema>;
export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;

