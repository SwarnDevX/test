import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, workspaceProcedure, router } from "../trpc.js";

export const workspaceRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.workspaceMember.findMany({
      where: { userId: ctx.userId },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true, plan: true, logoUrl: true, createdAt: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
  }),

  get: workspaceProcedure.query(async ({ ctx }) => {
    const workspace = await ctx.prisma.workspace.findUnique({
      where: { id: ctx.workspaceId },
      include: {
        _count: { select: { members: true, workflows: true } },
        subscription: true,
      },
    });
    if (!workspace) throw new TRPCError({ code: "NOT_FOUND" });
    return workspace;
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(2).max(100), slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/) }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.workspace.findUnique({ where: { slug: input.slug } });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "Slug already taken" });

      const workspace = await ctx.prisma.workspace.create({
        data: {
          name: input.name,
          slug: input.slug,
          members: { create: { userId: ctx.userId, role: "OWNER", joinedAt: new Date() } },
        },
      });
      return workspace;
    }),

  update: workspaceProcedure
    .input(z.object({ name: z.string().min(2).max(100).optional(), description: z.string().max(500).optional(), logoUrl: z.string().url().optional().nullable() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.workspace.update({
        where: { id: ctx.workspaceId },
        data: input,
      });
    }),

  members: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.prisma.workspaceMember.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { joinedAt: "asc" },
    });
  }),

  invite: workspaceProcedure
    .input(z.object({ email: z.string().email(), role: z.enum(["ADMIN", "EDITOR", "VIEWER"]) }))
    .mutation(async ({ input, ctx }) => {
      const inviteToken = crypto.randomUUID();
      await ctx.prisma.workspaceMember.create({
        data: {
          workspaceId: ctx.workspaceId,
          userId: ctx.userId, // placeholder — will be updated on accept
          role: input.role,
          inviteEmail: input.email,
          inviteToken,
          invitedAt: new Date(),
        },
      });
      // In production, send invite email
      return { success: true, inviteToken };
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.prisma.workspaceMember.findUnique({ where: { inviteToken: input.token } });
      if (!member) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired invite" });

      await ctx.prisma.workspaceMember.update({
        where: { inviteToken: input.token },
        data: { userId: ctx.userId, joinedAt: new Date(), inviteToken: null, inviteEmail: null },
      });

      return { workspaceId: member.workspaceId };
    }),

  updateMemberRole: workspaceProcedure
    .input(z.object({ memberId: z.string(), role: z.enum(["ADMIN", "EDITOR", "VIEWER"]) }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.workspaceMember.update({
        where: { id: input.memberId },
        data: { role: input.role },
      });
      return { success: true };
    }),

  removeMember: workspaceProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const member = await ctx.prisma.workspaceMember.findFirst({
        where: { id: input.memberId, workspaceId: ctx.workspaceId },
      });
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });
      if (member.role === "OWNER") throw new TRPCError({ code: "FORBIDDEN", message: "Cannot remove owner" });

      await ctx.prisma.workspaceMember.delete({ where: { id: input.memberId } });
      return { success: true };
    }),
});
