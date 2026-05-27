import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc.js";

// Admin procedures — requires OWNER role
const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const ownedWorkspace = await ctx.prisma.workspaceMember.findFirst({
    where: { userId: ctx.userId, role: "OWNER" },
  });
  if (!ownedWorkspace) throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx: { ...ctx, workspaceId: ownedWorkspace.workspaceId } });
});

export const adminRouter = router({
  users: adminProcedure
    .input(z.object({ page: z.number().default(1), pageSize: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      const [items, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where: { deletedAt: null },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
          select: { id: true, name: true, email: true, image: true, createdAt: true, emailVerified: true },
          orderBy: { createdAt: "desc" },
        }),
        ctx.prisma.user.count({ where: { deletedAt: null } }),
      ]);
      return { items, total };
    }),

  workspaces: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.workspace.findMany({
      where: { deletedAt: null },
      include: { _count: { select: { members: true, workflows: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const [users, workspaces, workflows, executions] = await Promise.all([
      ctx.prisma.user.count({ where: { deletedAt: null } }),
      ctx.prisma.workspace.count({ where: { deletedAt: null } }),
      ctx.prisma.workflow.count({ where: { deletedAt: null } }),
      ctx.prisma.execution.count(),
    ]);
    return { users, workspaces, workflows, executions };
  }),
});
