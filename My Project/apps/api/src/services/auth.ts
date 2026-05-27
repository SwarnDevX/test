import { createHmac } from "crypto";

const SECRET = process.env["AUTH_SECRET"] ?? "change-me-in-production";

interface TokenPayload {
  userId: string;
  workspaceId?: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: TokenPayload, expiresInSeconds = 7 * 24 * 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const data = { ...payload, iat: now, exp: now + expiresInSeconds };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts as [string, string, string];
    const expected = createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as TokenPayload;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
