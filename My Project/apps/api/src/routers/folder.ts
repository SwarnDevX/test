import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { workspaceProcedure, router } from "../trpc.js";

export const folderRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.prisma.folder.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { _count: { select: { workflows: true, children: true } } },
      orderBy: { name: "asc" },
    });
  }),

  create: workspaceProcedure
    .input(z.object({ name: z.string().min(1).max(100), parentId: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.folder.create({
        data: { workspaceId: ctx.workspaceId, ...input },
      });
    }),

  update: workspaceProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), color: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const folder = await ctx.prisma.folder.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.folder.update({ where: { id }, data });
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const folder = await ctx.prisma.folder.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
      if (!folder) throw new TRPCError({ code: "NOT_FOUND" });
      // Move workflows out before deleting
      await ctx.prisma.workflow.updateMany({ where: { folderId: input.id }, data: { folderId: null } });
      await ctx.prisma.folder.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
