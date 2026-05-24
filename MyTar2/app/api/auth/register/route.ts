import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword, signToken, makeAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const user = await db.user.create({
      data: { name, email, passwordHash: await hashPassword(password), credits: 10, subscription: 'free' },
      select: { id: true, email: true, name: true, credits: true, subscription: true },
    });

    const token = await signToken({ userId: user.id, email: user.email });
    const cookieCfg = makeAuthCookie(token);

    // Set cookie on the response object — required in Next.js 15/16 Route Handlers
    const response = NextResponse.json({ user }, { status: 201 });

    response.cookies.set(cookieCfg.name, cookieCfg.value, {
      httpOnly: cookieCfg.httpOnly,
      secure: cookieCfg.secure,
      sameSite: cookieCfg.sameSite,
      maxAge: cookieCfg.maxAge,
      path: cookieCfg.path,
    });

    return response;
  } catch (err) {
    console.error('[REGISTER]', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
