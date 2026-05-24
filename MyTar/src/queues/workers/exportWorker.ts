import { Worker, Job } from 'bullmq';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { getPublicUrl, generateKey } from '@/lib/s3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { ExportJob } from '@/types/ai';
import { Layer, TextLayer, ImageLayer, BackgroundLayer } from '@/types/canvas';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

async function renderCanvasToBuffer(
  canvasState: { layers: Layer[]; width: number; height: number; backgroundColor: string },
): Promise<Buffer> {
  const { width, height, backgroundColor, layers } = canvasState;

  // Create base image with background color
  const composites: sharp.OverlayOptions[] = [];

  // Sort layers by zIndex
  const sorted = [...layers].sort((a, b) => a.zIndex - b.zIndex).filter((l) => l.visible);

  for (const layer of sorted) {
    if (layer.type === 'image' || layer.type === 'background') {
      const imgLayer = layer as ImageLayer | BackgroundLayer;
      const url = (imgLayer as ImageLayer).imageUrl || (imgLayer as BackgroundLayer).imageUrl;
      if (url) {
        try {
          const res = await fetch(url);
          const buf = Buffer.from(await res.arrayBuffer());
          const resized = await sharp(buf).resize(layer.width, layer.height).toBuffer();
          composites.push({
            input: resized,
            left: Math.round(layer.x),
            top: Math.round(layer.y),
          });
        } catch {}
      }
    }
  }

  const base = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: backgroundColor || '#ffffff',
    },
  })
    .composite(composites)
    .png()
    .toBuffer();

  return base;
}

export const exportWorker = new Worker(
  'export-jobs',
  async (job: Job<ExportJob>) => {
    const { userId, projectId, assetId, canvasState, width, height, format } = job.data;

    await prisma.generatedAsset.update({
      where: { id: assetId },
      data: { status: 'PROCESSING' },
    });

    try {
      const imageBuffer = await renderCanvasToBuffer(canvasState as any);

      const key = generateKey(userId, 'exports', `${assetId}.${format}`);
      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || '',
        Key: key,
        Body: imageBuffer,
        ContentType: format === 'png' ? 'image/png' : 'image/jpeg',
      }));

      const resultUrl = getPublicUrl(key);

      await prisma.generatedAsset.update({
        where: { id: assetId },
        data: { status: 'DONE', resultUrl },
      });

      // Also update project thumbnail
      await prisma.project.update({
        where: { id: projectId },
        data: { thumbnailUrl: resultUrl, status: 'EXPORTED' },
      });

      return { resultUrl };
    } catch (error) {
      await prisma.generatedAsset.update({
        where: { id: assetId },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  },
  { connection: redis, concurrency: 2 }
);

exportWorker.on('completed', (job) => {
  console.log(`[ExportWorker] Job ${job.id} completed`);
});

exportWorker.on('failed', (job, err) => {
  console.error(`[ExportWorker] Job ${job?.id} failed:`, err.message);
});

