import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@flowforge/db";
import { hashApiKey } from "@flowforge/shared";

import { verifyToken } from "./services/auth.js";

export interface Context {
  req: FastifyRequest;
  res: FastifyReply;
  prisma: typeof prisma;
  userId?: string;
  workspaceId?: string;
  sessionId?: string;
}

export async function createContext({ req, res }: { req: FastifyRequest; res: FastifyReply }): Promise<Context> {
  const ctx: Context = { req, res, prisma };

  // Try session cookie first
  const reqWithCookies = req as FastifyRequest & { cookies?: Record<string, string | undefined> };
  const sessionToken = reqWithCookies.cookies?.["next-auth.session-token"] ?? reqWithCookies.cookies?.["__Secure-next-auth.session-token"];
  if (sessionToken) {
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });
    if (session && session.expires > new Date()) {
      ctx.userId = session.userId;
      ctx.sessionId = session.id;
    }
  }

  // Try API key header
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey && !ctx.userId) {
    const keyHash = hashApiKey(apiKey);
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
    });
    if (keyRecord && !keyRecord.deletedAt && (!keyRecord.expiresAt || keyRecord.expiresAt > new Date())) {
      ctx.userId = "api-key";
      ctx.workspaceId = keyRecord.workspaceId;
      await prisma.apiKey.update({
        where: { id: keyRecord.id },
        data: { lastUsedAt: new Date() },
      });
    }
  }

  // Try Bearer token
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ") && !ctx.userId) {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    if (payload) {
      ctx.userId = payload.userId;
      ctx.workspaceId = payload.workspaceId;
    }
  }

  // Workspace from header (multi-workspace support)
  const workspaceId = req.headers["x-workspace-id"] as string | undefined;
  if (workspaceId && !ctx.workspaceId) {
    ctx.workspaceId = workspaceId;
  }

  return ctx;
}
