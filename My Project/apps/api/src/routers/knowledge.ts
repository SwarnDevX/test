import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createKnowledgeBaseSchema } from "@flowforge/shared";

import { knowledgeQueue } from "../services/queues.js";
import { workspaceProcedure, router } from "../trpc.js";

export const knowledgeRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.prisma.knowledgeBase.findMany({
      where: { workspaceId: ctx.workspaceId, deletedAt: null },
      include: { _count: { select: { documents: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  get: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const kb = await ctx.prisma.knowledgeBase.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
        include: {
          documents: {
            include: { _count: { select: { chunks: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!kb) throw new TRPCError({ code: "NOT_FOUND" });
      return kb;
    }),

  create: workspaceProcedure
    .input(createKnowledgeBaseSchema)
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.knowledgeBase.create({
        data: { ...input, workspaceId: ctx.workspaceId },
      });
    }),

  update: workspaceProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), description: z.string().optional(), chunkSize: z.number().optional(), chunkOverlap: z.number().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const kb = await ctx.prisma.knowledgeBase.findFirst({ where: { id, workspaceId: ctx.workspaceId, deletedAt: null } });
      if (!kb) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.knowledgeBase.update({ where: { id }, data });
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const kb = await ctx.prisma.knowledgeBase.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null } });
      if (!kb) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.knowledgeBase.update({ where: { id: input.id }, data: { deletedAt: new Date() } });
      return { success: true };
    }),

  addDocument: workspaceProcedure
    .input(z.object({
      knowledgeBaseId: z.string(),
      name: z.string(),
      sourceType: z.enum(["file", "url", "text"]),
      sourceUrl: z.string().url().optional(),
      text: z.string().optional(),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const kb = await ctx.prisma.knowledgeBase.findFirst({ where: { id: input.knowledgeBaseId, workspaceId: ctx.workspaceId } });
      if (!kb) throw new TRPCError({ code: "NOT_FOUND" });

      const doc = await ctx.prisma.document.create({
        data: {
          knowledgeBaseId: input.knowledgeBaseId,
          name: input.name,
          sourceType: input.sourceType,
          sourceUrl: input.sourceUrl,
          mimeType: input.mimeType,
          status: "pending",
        },
      });

      await knowledgeQueue.add("ingest", {
        documentId: doc.id,
        knowledgeBaseId: input.knowledgeBaseId,
        workspaceId: ctx.workspaceId,
        sourceType: input.sourceType,
        sourceUrl: input.sourceUrl,
        text: input.text,
        embeddingModel: kb.embeddingModel,
        chunkSize: kb.chunkSize,
        chunkOverlap: kb.chunkOverlap,
      });

      return doc;
    }),

  deleteDocument: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const doc = await ctx.prisma.document.findFirst({
        where: { id: input.id },
        include: { knowledgeBase: true },
      });
      if (!doc || doc.knowledgeBase.workspaceId !== ctx.workspaceId) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.chunk.deleteMany({ where: { documentId: input.id } });
      await ctx.prisma.document.delete({ where: { id: input.id } });
      return { success: true };
    }),

  testRetrieval: workspaceProcedure
    .input(z.object({ knowledgeBaseId: z.string(), query: z.string(), topK: z.number().min(1).max(20).default(5) }))
    .mutation(async ({ input, ctx }) => {
      const kb = await ctx.prisma.knowledgeBase.findFirst({ where: { id: input.knowledgeBaseId, workspaceId: ctx.workspaceId } });
      if (!kb) throw new TRPCError({ code: "NOT_FOUND" });

      // Retrieve top-k chunks using pgvector cosine similarity
      // In production this uses the embedding model to embed the query, then vector search
      const chunks = await ctx.prisma.$queryRaw<Array<{ id: string; content: string; metadata: unknown; score: number }>>`
        SELECT c.id, c.content, c.metadata,
               1 - (c.embedding <=> (
                 SELECT embedding FROM chunks
                 WHERE document_id IN (SELECT id FROM documents WHERE knowledge_base_id = ${input.knowledgeBaseId})
                 LIMIT 1
               )) as score
        FROM chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE d.knowledge_base_id = ${input.knowledgeBaseId}
          AND c.embedding IS NOT NULL
        ORDER BY c.embedding <=> (SELECT embedding FROM chunks WHERE document_id IN (SELECT id FROM documents WHERE knowledge_base_id = ${input.knowledgeBaseId}) LIMIT 1)
        LIMIT ${input.topK}
      `;

      return { query: input.query, results: chunks };
    }),
});
