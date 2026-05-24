import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUploadSignedUrl, generateKey } from '@/lib/s3';
import { z } from 'zod';

const schema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  type: z.enum(['logo', 'upload', 'asset']).default('upload'),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

  const { filename, contentType, type } = parsed.data;

  // Validate content type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  const key = generateKey(session.user.id, type, filename);
  const uploadUrl = await getUploadSignedUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key, publicUrl: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}` });
}

