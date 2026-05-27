import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createWorkflowSchema, paginationSchema, updateWorkflowSchema } from "@flowforge/shared";

import { workspaceProcedure, router } from "../trpc.js";

export const workflowRouter = router({
  list: workspaceProcedure
    .input(z.object({
      ...paginationSchema.shape,
      folderId: z.string().optional().nullable(),
      search: z.string().optional(),
      tags: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, folderId, search, isActive } = input;

      const where = {
        workspaceId: ctx.workspaceId,
        deletedAt: null,
        ...(folderId !== undefined ? { folderId: folderId ?? null } : {}),
        ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { description: { contains: search, mode: "insensitive" as const } },
          ],
        } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.workflow.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { updatedAt: "desc" },
          include: {
            tags: { include: { tag: true } },
            folder: { select: { id: true, name: true } },
            _count: { select: { executions: true } },
          },
        }),
        ctx.prisma.workflow.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      };
    }),

  get: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const workflow = await ctx.prisma.workflow.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
        include: {
          tags: { include: { tag: true } },
          folder: { select: { id: true, name: true } },
          versions: { orderBy: { version: "desc" }, take: 20 },
          _count: { select: { executions: true } },
        },
      });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });
      return workflow;
    }),

  create: workspaceProcedure
    .input(createWorkflowSchema)
    .mutation(async ({ input, ctx }) => {
      let definition = input.definition ?? {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 0.8 },
      };

      // Clone from template if specified
      if (input.templateId) {
        const template = await ctx.prisma.template.findUnique({ where: { id: input.templateId } });
        if (template) {
          definition = template.definition as typeof definition;
        }
      }

      const workflow = await ctx.prisma.workflow.create({
        data: {
          workspaceId: ctx.workspaceId,
          name: input.name,
          description: input.description,
          folderId: input.folderId,
          definition: definition as any,
        },
      });

      // Create initial version
      await ctx.prisma.workflowVersion.create({
        data: {
          workflowId: workflow.id,
          version: 1,
          definition: definition as any,
          message: "Initial version",
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          action: "workflow.create",
          resourceType: "Workflow",
          resourceId: workflow.id,
          metadata: { name: workflow.name },
        },
      });

      return workflow;
    }),

  update: workspaceProcedure
    .input(z.object({ id: z.string(), ...updateWorkflowSchema.shape }))
    .mutation(async ({ input, ctx }) => {
      const { id, versionMessage, definition, ...data } = input;

      const existing = await ctx.prisma.workflow.findFirst({
        where: { id, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const workflow = await ctx.prisma.workflow.update({
        where: { id },
        data: {
          ...data,
          ...(definition ? { definition: definition as any } : {}),
        },
      });

      // Save a new version if definition changed
      if (definition) {
        const latestVersion = await ctx.prisma.workflowVersion.findFirst({
          where: { workflowId: id },
          orderBy: { version: "desc" },
        });
        const nextVersion = (latestVersion?.version ?? 0) + 1;

        await ctx.prisma.workflowVersion.create({
          data: {
            workflowId: id,
            version: nextVersion,
            definition: definition as any,
            message: versionMessage ?? `Auto-save v${nextVersion}`,
          },
        });
      }

      await ctx.prisma.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          action: "workflow.update",
          resourceType: "Workflow",
          resourceId: id,
          metadata: { changes: Object.keys(input) },
        },
      });

      return workflow;
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.workflow.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.workflow.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      await ctx.prisma.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          action: "workflow.delete",
          resourceType: "Workflow",
          resourceId: input.id,
        },
      });

      return { success: true };
    }),

  duplicate: workspaceProcedure
    .input(z.object({ id: z.string(), name: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const source = await ctx.prisma.workflow.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!source) throw new TRPCError({ code: "NOT_FOUND" });

      const copy = await ctx.prisma.workflow.create({
        data: {
          workspaceId: ctx.workspaceId,
          name: input.name ?? `${source.name} (copy)`,
          description: source.description,
          definition: source.definition as object,
        },
      });

      await ctx.prisma.workflowVersion.create({
        data: {
          workflowId: copy.id,
          version: 1,
          definition: source.definition as object,
          message: `Copied from ${source.name}`,
        },
      });

      return copy;
    }),

  versions: workspaceProcedure
    .input(z.object({ workflowId: z.string(), page: z.number().default(1), pageSize: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const workflow = await ctx.prisma.workflow.findFirst({
        where: { id: input.workflowId, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });

      const [items, total] = await Promise.all([
        ctx.prisma.workflowVersion.findMany({
          where: { workflowId: input.workflowId },
          orderBy: { version: "desc" },
          skip: (input.page - 1) * input.pageSize,
          take: input.pageSize,
        }),
        ctx.prisma.workflowVersion.count({ where: { workflowId: input.workflowId } }),
      ]);

      return { items, total, page: input.page, pageSize: input.pageSize, hasMore: input.page * input.pageSize < total };
    }),

  restoreVersion: workspaceProcedure
    .input(z.object({ workflowId: z.string(), version: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const versionRecord = await ctx.prisma.workflowVersion.findUnique({
        where: { workflowId_version: { workflowId: input.workflowId, version: input.version } },
      });
      if (!versionRecord) throw new TRPCError({ code: "NOT_FOUND" });

      const workflow = await ctx.prisma.workflow.findFirst({
        where: { id: input.workflowId, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND" });

      const latest = await ctx.prisma.workflowVersion.findFirst({
        where: { workflowId: input.workflowId },
        orderBy: { version: "desc" },
      });

      await ctx.prisma.workflow.update({
        where: { id: input.workflowId },
        data: { definition: versionRecord.definition as object },
      });

      await ctx.prisma.workflowVersion.create({
        data: {
          workflowId: input.workflowId,
          version: (latest?.version ?? 0) + 1,
          definition: versionRecord.definition as object,
          message: `Restored from v${input.version}`,
        },
      });

      return { success: true };
    }),
});
