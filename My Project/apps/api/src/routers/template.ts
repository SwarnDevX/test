import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { paginationSchema } from "@flowforge/shared";

import { protectedProcedure, workspaceProcedure, router } from "../trpc.js";

export const templateRouter = router({
  list: protectedProcedure
    .input(z.object({
      ...paginationSchema.shape,
      category: z.string().optional(),
      search: z.string().optional(),
      official: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, category, search, official } = input;
      const where = {
        isPublic: true,
        ...(category ? { category } : {}),
        ...(official !== undefined ? { isOfficial: official } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.template.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: [{ isOfficial: "desc" }, { cloneCount: "desc" }],
        }),
        ctx.prisma.template.count({ where }),
      ]);

      return { items, total, page, pageSize, hasMore: page * pageSize < total };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const template = await ctx.prisma.template.findFirst({
        where: { id: input.id, isPublic: true },
      });
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });
      return template;
    }),

  clone: workspaceProcedure
    .input(z.object({ id: z.string(), name: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const template = await ctx.prisma.template.findFirst({ where: { id: input.id, isPublic: true } });
      if (!template) throw new TRPCError({ code: "NOT_FOUND" });

      const workflow = await ctx.prisma.workflow.create({
        data: {
          workspaceId: ctx.workspaceId,
          name: input.name ?? template.name,
          description: template.description,
          definition: template.definition as object,
        },
      });

      await ctx.prisma.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          version: 1,
          definition: template.definition as object,
          message: `Cloned from template: ${template.name}`,
        },
      });

      await ctx.prisma.template.update({
        where: { id: input.id },
        data: { cloneCount: { increment: 1 } },
      });

      return workflow;
    }),

  categories: protectedProcedure.query(async ({ ctx }) => {
    const result = await ctx.prisma.template.groupBy({
      by: ["category"],
      where: { isPublic: true },
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });
    return result.map((r) => ({ name: r.category, count: r._count.category }));
  }),
});
