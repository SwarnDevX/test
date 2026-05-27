import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { executionFiltersSchema, runWorkflowSchema } from "@flowforge/shared";

import { executionQueue } from "../services/queues.js";
import { workspaceProcedure, router } from "../trpc.js";

export const executionRouter = router({
  run: workspaceProcedure
    .input(runWorkflowSchema)
    .mutation(async ({ input, ctx }) => {
      const workflow = await ctx.prisma.workflow.findFirst({
        where: { id: input.workflowId, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });
      if (!workflow.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Workflow is disabled" });

      const execution = await ctx.prisma.execution.create({
        data: {
          workflowId: input.workflowId,
          workspaceId: ctx.workspaceId,
          status: "PENDING",
          trigger: "manual",
          triggerData: (input.triggerData ?? {}) as any,
        },
      });

      await executionQueue.add(
        "execute",
        {
          executionId: execution.id,
          workflowId: input.workflowId,
          workspaceId: ctx.workspaceId,
          definition: workflow.definition,
          triggerData: (input.triggerData ?? {}) as any,
          startFromNodeId: input.startFromNodeId,
          testMode: input.testMode ?? false,
        },
        {
          jobId: `exec-${execution.id}`,
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 1000 },
          attempts: 1,
        },
      );

      return execution;
    }),

  list: workspaceProcedure
    .input(executionFiltersSchema)
    .query(async ({ input, ctx }) => {
      const { page, pageSize, workflowId, status, trigger, from, to } = input;

      const where = {
        workspaceId: ctx.workspaceId,
        ...(workflowId ? { workflowId } : {}),
        ...(status ? { status } : {}),
        ...(trigger ? { trigger } : {}),
        ...(from || to ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.execution.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: {
            workflow: { select: { id: true, name: true } },
            _count: { select: { steps: true } },
          },
        }),
        ctx.prisma.execution.count({ where }),
      ]);

      return { items, total, page, pageSize, hasMore: page * pageSize < total };
    }),

  get: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const execution = await ctx.prisma.execution.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId },
        include: {
          steps: { orderBy: { createdAt: "asc" } },
          workflow: { select: { id: true, name: true } },
        },
      });
      if (!execution) throw new TRPCError({ code: "NOT_FOUND" });
      return execution;
    }),

  cancel: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const execution = await ctx.prisma.execution.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId },
      });
      if (!execution) throw new TRPCError({ code: "NOT_FOUND" });
      if (!["PENDING", "RUNNING", "PAUSED"].includes(execution.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Execution cannot be cancelled" });
      }

      // Remove from queue if pending
      const job = await executionQueue.getJob(`exec-${input.id}`);
      if (job) await job.remove();

      await ctx.prisma.execution.update({
        where: { id: input.id },
        data: { status: "CANCELLED", completedAt: new Date() },
      });

      return { success: true };
    }),

  replay: workspaceProcedure
    .input(z.object({ id: z.string(), fromNodeId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const original = await ctx.prisma.execution.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId },
        include: { workflow: true },
      });
      if (!original) throw new TRPCError({ code: "NOT_FOUND" });

      const execution = await ctx.prisma.execution.create({
        data: {
          workflowId: original.workflowId,
          workspaceId: ctx.workspaceId,
          status: "PENDING",
          trigger: "manual",
          triggerData: original.triggerData ?? {},
        },
      });

      await executionQueue.add("execute", {
        executionId: execution.id,
        workflowId: original.workflowId,
        workspaceId: ctx.workspaceId,
        definition: original.workflow.definition,
        triggerData: original.triggerData,
        startFromNodeId: input.fromNodeId,
      });

      return execution;
    }),

  testNode: workspaceProcedure
    .input(z.object({
      workflowId: z.string(),
      nodeId: z.string(),
      nodeType: z.string(),
      params: z.record(z.unknown()),
      inputData: z.record(z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const workflow = await ctx.prisma.workflow.findFirst({
        where: { id: input.workflowId, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });

      const execution = await ctx.prisma.execution.create({
        data: {
          workflowId: input.workflowId,
          workspaceId: ctx.workspaceId,
          status: "PENDING",
          trigger: "manual",
          triggerData: {},
        },
      });

      await executionQueue.add("test-node", {
        executionId: execution.id,
        workflowId: input.workflowId,
        workspaceId: ctx.workspaceId,
        nodeId: input.nodeId,
        nodeType: input.nodeType,
        params: input.params,
        inputData: input.inputData ?? {},
        testMode: true,
      });

      return execution;
    }),
});
