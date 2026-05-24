import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { deductCredits } from '@/lib/credits';
import { getPublicUrl, generateKey } from '@/lib/s3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { BackgroundGenerationJob } from '@/types/ai';
import { applyStylePreset } from '@/lib/stylePresets';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function generateWithStabilityAI(prompt: string, width: number, height: number): Promise<Buffer> {
  const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
    },
    body: JSON.stringify({
      text_prompts: [
        { text: prompt, weight: 1 },
        { text: 'blurry, low quality, text, watermark', weight: -1 },
      ],
      cfg_scale: 7,
      width: Math.min(width, 1024),
      height: Math.min(height, 1024),
      steps: 30,
      samples: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Stability AI error: ${response.statusText}`);
  }

  const data = await response.json() as { artifacts: Array<{ base64: string }> };
  return Buffer.from(data.artifacts[0].base64, 'base64');
}

export const backgroundWorker = new Worker(
  'ai-jobs',
  async (job: Job<BackgroundGenerationJob>) => {
    const { userId, projectId, assetId, prompt, width, height, style } = job.data;

    // Update status to processing
    await prisma.generatedAsset.update({
      where: { id: assetId },
      data: { status: 'PROCESSING' },
    });

    try {
      // Apply style preset to prompt
      const styledPrompt = style ? applyStylePreset(prompt, style) : prompt;

      // Generate image
      const imageBuffer = await generateWithStabilityAI(styledPrompt, width, height);

      // Upload to S3
      const key = generateKey(userId, 'backgrounds', `${assetId}.png`);
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: key,
        Body: imageBuffer,
        ContentType: 'image/png',
      }));

      const resultUrl = getPublicUrl(key);

      // Update asset and deduct credits in transaction
      await prisma.$transaction([
        prisma.generatedAsset.update({
          where: { id: assetId },
          data: { status: 'DONE', resultUrl },
        }),
      ]);

      // Deduct credits
      await deductCredits(userId, 3);

      return { resultUrl };
    } catch (error) {
      await prisma.generatedAsset.update({
        where: { id: assetId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  },
  { connection: redis, concurrency: 3 }
);

backgroundWorker.on('completed', (job) => {
  console.log(`[BackgroundWorker] Job ${job.id} completed`);
});

backgroundWorker.on('failed', (job, err) => {
  console.error(`[BackgroundWorker] Job ${job?.id} failed:`, err.message);
});

