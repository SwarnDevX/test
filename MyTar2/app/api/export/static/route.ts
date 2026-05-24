import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { dataUrl, filename = 'ad-creative.png' } = await request.json();
  if (!dataUrl) return NextResponse.json({ error: 'Canvas data required' }, { status: 400 });

  // Return the dataUrl to the client for download
  // In production you'd upload to S3 and return a signed URL
  return NextResponse.json({ url: dataUrl, filename });
}
