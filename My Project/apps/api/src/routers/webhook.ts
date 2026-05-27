import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { randomBytes } from "crypto";

import { workspaceProcedure, router } from "../trpc.js";

export const webhookRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.prisma.webhook.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { workflow: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: workspaceProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      workflowId: z.string().optional(),
      events: z.array(z.string()).default([]),
    }))
    .mutation(async ({ input, ctx }) => {
      const webhookId = crypto.randomUUID();
      const secret = randomBytes(32).toString("hex");
      const baseUrl = process.env["WEBHOOK_BASE_URL"] ?? "http://localhost:3001";

      const webhook = await ctx.prisma.webhook.create({
        data: {
          workspaceId: ctx.workspaceId,
          workflowId: input.workflowId,
          name: input.name,
          url: `${baseUrl}/webhooks/${webhookId}`,
          secretHash: secret, // stored as-is for HMAC signing — user sees it once
          events: input.events,
        },
      });

      return { ...webhook, secret }; // Return secret only on creation
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const wh = await ctx.prisma.webhook.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
      if (!wh) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.webhook.delete({ where: { id: input.id } });
      return { success: true };
    }),

  rotateSecret: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const wh = await ctx.prisma.webhook.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
      if (!wh) throw new TRPCError({ code: "NOT_FOUND" });
      const newSecret = randomBytes(32).toString("hex");
      await ctx.prisma.webhook.update({ where: { id: input.id }, data: { secretHash: newSecret } });
      return { secret: newSecret };
    }),
});
