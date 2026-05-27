import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { generateApiKey } from "@flowforge/shared";

import { workspaceProcedure, router } from "../trpc.js";

export const apiKeyRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.prisma.apiKey.findMany({
      where: { workspaceId: ctx.workspaceId, deletedAt: null },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: workspaceProcedure
    .input(z.object({ name: z.string().min(1).max(100), expiresAt: z.coerce.date().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { key, hash, displayPrefix } = generateApiKey("ff_live_");

      await ctx.prisma.apiKey.create({
        data: {
          workspaceId: ctx.workspaceId,
          name: input.name,
          keyHash: hash,
          keyPrefix: displayPrefix,
          expiresAt: input.expiresAt,
        },
      });

      // Return the raw key only once — never stored in plain
      return { key, prefix: displayPrefix };
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const key = await ctx.prisma.apiKey.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
      if (!key) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.apiKey.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
      return { success: true };
    }),
});
