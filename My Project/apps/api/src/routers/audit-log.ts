import { z } from "zod";
import { paginationSchema } from "@flowforge/shared";
import { workspaceProcedure, router } from "../trpc.js";

export const auditLogRouter = router({
  list: workspaceProcedure
    .input(z.object({
      ...paginationSchema.shape,
      action: z.string().optional(),
      resourceType: z.string().optional(),
      userId: z.string().optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const { page, pageSize, action, resourceType, userId, from, to } = input;
      const where = {
        workspaceId: ctx.workspaceId,
        ...(action ? { action: { contains: action } } : {}),
        ...(resourceType ? { resourceType } : {}),
        ...(userId ? { userId } : {}),
        ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        ctx.prisma.auditLog.count({ where }),
      ]);

      return { items, total, page, pageSize, hasMore: page * pageSize < total };
    }),
});
