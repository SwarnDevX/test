import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comparePassword, signToken, makeAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    let user;

    // Demo account shortcut
    if (email === 'demo@adcreative.ai' && password === 'demo1234') {
      user = await db.user.findUnique({ where: { email } });
      if (!user) {
        const bcrypt = await import('bcryptjs');
        user = await db.user.create({
          data: {
            name: 'Demo User',
            email,
            passwordHash: await bcrypt.hash('demo1234', 12),
            credits: 50,
            subscription: 'pro',
          },
        });
      }
    } else {
      user = await db.user.findUnique({ where: { email } });
      if (!user || !(await comparePassword(password, user.passwordHash))) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }
    }

    const token = await signToken({ userId: user.id, email: user.email });
    const cookieCfg = makeAuthCookie(token);

    // Set cookie on the response object — this is the correct way in Next.js 15/16 Route Handlers
    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, credits: user.credits, subscription: user.subscription },
    });

    response.cookies.set(cookieCfg.name, cookieCfg.value, {
      httpOnly: cookieCfg.httpOnly,
      secure: cookieCfg.secure,
      sameSite: cookieCfg.sameSite,
      maxAge: cookieCfg.maxAge,
      path: cookieCfg.path,
    });

    return response;
  } catch (err) {
    console.error('[LOGIN]', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
