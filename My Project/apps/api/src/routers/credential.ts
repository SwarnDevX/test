import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createCredentialSchema, envelopeEncrypt, envelopeDecrypt, getMasterKey } from "@flowforge/shared";

import { workspaceProcedure, router } from "../trpc.js";

export const credentialRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.prisma.credential.findMany({
      where: { workspaceId: ctx.workspaceId, deletedAt: null },
      select: { id: true, name: true, type: true, service: true, isValid: true, lastTestedAt: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: workspaceProcedure
    .input(createCredentialSchema)
    .mutation(async ({ input, ctx }) => {
      const masterKey = getMasterKey();
      const plaintext = JSON.stringify(input.data);
      const { encryptedData, encryptedDek } = envelopeEncrypt(plaintext, masterKey);

      const credential = await ctx.prisma.credential.create({
        data: {
          workspaceId: ctx.workspaceId,
          name: input.name,
          type: input.type,
          service: input.service,
          encryptedData,
          encryptedDek,
        },
        select: { id: true, name: true, type: true, service: true, createdAt: true },
      });

      await ctx.prisma.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          action: "credential.create",
          resourceType: "Credential",
          resourceId: credential.id,
          metadata: { service: input.service },
        },
      });

      return credential;
    }),

  update: workspaceProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), data: z.record(z.unknown()).optional() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.credential.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const updateData: Record<string, unknown> = {};
      if (input.name) updateData["name"] = input.name;
      if (input.data) {
        const masterKey = getMasterKey();
        const { encryptedData, encryptedDek } = envelopeEncrypt(JSON.stringify(input.data), masterKey);
        updateData["encryptedData"] = encryptedData;
        updateData["encryptedDek"] = encryptedDek;
        updateData["isValid"] = null;
      }

      return ctx.prisma.credential.update({
        where: { id: input.id },
        data: updateData,
        select: { id: true, name: true, type: true, service: true, isValid: true, updatedAt: true },
      });
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.credential.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.prisma.credential.update({
        where: { id: input.id },
        data: { deletedAt: new Date() },
      });

      await ctx.prisma.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          action: "credential.delete",
          resourceType: "Credential",
          resourceId: input.id,
        },
      });

      return { success: true };
    }),

  getDecrypted: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const cred = await ctx.prisma.credential.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!cred) throw new TRPCError({ code: "NOT_FOUND" });

      const masterKey = getMasterKey();
      const plaintext = envelopeDecrypt({ encryptedData: cred.encryptedData, encryptedDek: cred.encryptedDek }, masterKey);
      return JSON.parse(plaintext) as Record<string, unknown>;
    }),

  test: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const cred = await ctx.prisma.credential.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!cred) throw new TRPCError({ code: "NOT_FOUND" });

      const masterKey = getMasterKey();
      const plaintext = envelopeDecrypt({ encryptedData: cred.encryptedData, encryptedDek: cred.encryptedDek }, masterKey);
      const data = JSON.parse(plaintext) as Record<string, string>;

      let isValid = false;
      let error: string | undefined;

      try {
        isValid = await testCredential(cred.service, cred.type, data);
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
      }

      await ctx.prisma.credential.update({
        where: { id: input.id },
        data: { isValid, lastTestedAt: new Date() },
      });

      return { isValid, error };
    }),
});

async function testCredential(service: string, _type: string, data: Record<string, string>): Promise<boolean> {
  switch (service) {
    case "openai": {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${data["apiKey"] ?? ""}` },
      });
      return res.ok;
    }
    case "anthropic": {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": data["apiKey"] ?? "", "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1, messages: [{ role: "user", content: "hi" }] }),
      });
      return res.status !== 401;
    }
    case "slack": {
      const res = await fetch("https://slack.com/api/auth.test", {
        headers: { Authorization: `Bearer ${data["accessToken"] ?? ""}` },
      });
      const json = await res.json() as { ok: boolean };
      return json.ok;
    }
    default:
      return true; // Can't test without service-specific logic
  }
}
