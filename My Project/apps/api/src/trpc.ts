import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import type { Context } from "./context.js";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Auth middleware
const enforceAuth = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "You must be logged in" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});

// Workspace auth middleware
const enforceWorkspaceAccess = middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  if (!ctx.workspaceId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Workspace ID required" });
  }

  const member = await ctx.prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: ctx.workspaceId, userId: ctx.userId } },
  });

  if (!member) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this workspace" });
  }

  return next({ ctx: { ...ctx, userId: ctx.userId, workspaceId: ctx.workspaceId, role: member.role } });
});

export const protectedProcedure = t.procedure.use(enforceAuth);
export const workspaceProcedure = t.procedure.use(enforceWorkspaceAccess);

export const createCallerFactory = t.createCallerFactory;
export type { Context };
