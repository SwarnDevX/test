import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { rateLimit, rateLimitResponse, AUTH_RATE_LIMIT } from '@/lib/rateLimit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { email, token, newPassword } = await req.json();

  // --- Step 1: Request reset (email provided, no token) ---
  if (email && !token) {
    const rl = await rateLimit(email, 'password-reset', AUTH_RATE_LIMIT);
    if (!rl.success) return rateLimitResponse(rl.resetAt);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to not reveal if email exists
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3_600_000); // 1 hour

      await prisma.verificationToken.upsert({
        where: { token: resetToken },
        update: {},
        create: { identifier: email, token: resetToken, expires },
      });

      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
      try {
        await sendPasswordResetEmail(email, resetUrl);
      } catch (e) {
        console.error('[Reset] Email send failed:', e);
      }
    }

    return NextResponse.json({ success: true });
  }

  // --- Step 2: Confirm reset (token + newPassword provided) ---
  if (token && newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const record = await prisma.verificationToken.findUnique({ where: { token } });

    if (!record || record.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: record.identifier },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({ where: { token } }),
    ]);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
}

