import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { workspaceProcedure, router } from "../trpc.js";
import { scheduleWorkflow, unscheduleWorkflow } from "../services/scheduler.js";

export const scheduledJobRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.prisma.scheduledJob.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { workflow: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: workspaceProcedure
    .input(z.object({
      workflowId: z.string(),
      name: z.string().min(1).max(255),
      cronExpr: z.string(),
      timezone: z.string().default("UTC"),
    }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await ctx.prisma.workflow.findFirst({ where: { id: input.workflowId, workspaceId: ctx.workspaceId } });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });

      const job = await ctx.prisma.scheduledJob.create({
        data: {
          workspaceId: ctx.workspaceId,
          workflowId: input.workflowId,
          name: input.name,
          cronExpr: input.cronExpr,
          timezone: input.timezone,
          isActive: true,
        },
      });

      const bullJobId = await scheduleWorkflow(job.id, input.workflowId, ctx.workspaceId, input.cronExpr, input.timezone);
      await ctx.prisma.scheduledJob.update({ where: { id: job.id }, data: { bullJobId } });

      return job;
    }),

  update: workspaceProcedure
    .input(z.object({ id: z.string(), cronExpr: z.string().optional(), isActive: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const job = await ctx.prisma.scheduledJob.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });

      if (job.bullJobId) await unscheduleWorkflow(job.bullJobId);

      let bullJobId = job.bullJobId;
      if (input.isActive !== false && (input.cronExpr ?? job.cronExpr)) {
        bullJobId = await scheduleWorkflow(job.id, job.workflowId, ctx.workspaceId, input.cronExpr ?? job.cronExpr, job.timezone);
      }

      return ctx.prisma.scheduledJob.update({
        where: { id: input.id },
        data: { ...input, bullJobId },
      });
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const job = await ctx.prisma.scheduledJob.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
      if (!job) throw new TRPCError({ code: "NOT_FOUND" });
      if (job.bullJobId) await unscheduleWorkflow(job.bullJobId);
      await ctx.prisma.scheduledJob.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
