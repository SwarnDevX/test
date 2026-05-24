import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { db } from './db';
import { signToken, verifyToken, JWTPayload } from './jwt';

export const COOKIE_NAME = 'auth-token';
export type { JWTPayload };
export { signToken, verifyToken };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, credits: true, subscription: true, avatar: true, createdAt: true },
  });
}

export function makeAuthCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };
}
