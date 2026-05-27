import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createDeploymentSchema } from "@flowforge/shared";

import { workspaceProcedure, router } from "../trpc.js";

export const deploymentRouter = router({
  list: workspaceProcedure.query(async ({ ctx }) => {
    return ctx.prisma.deployment.findMany({
      where: { workspaceId: ctx.workspaceId, deletedAt: null },
      include: { workflow: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  get: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const deployment = await ctx.prisma.deployment.findFirst({
        where: { id: input.id, workspaceId: ctx.workspaceId, deletedAt: null },
        include: { workflow: { select: { id: true, name: true } } },
      });
      if (!deployment) throw new TRPCError({ code: "NOT_FOUND" });
      return deployment;
    }),

  create: workspaceProcedure
    .input(createDeploymentSchema)
    .mutation(async ({ input, ctx }) => {
      const workflow = await ctx.prisma.workflow.findFirst({
        where: { id: input.workflowId, workspaceId: ctx.workspaceId, deletedAt: null },
      });
      if (!workflow) throw new TRPCError({ code: "NOT_FOUND", message: "Workflow not found" });

      const baseUrl = process.env["API_URL"] ?? "http://localhost:3001";
      const deployId = crypto.randomUUID().slice(0, 8);
      let publicUrl: string | undefined;
      let embedScript: string | undefined;
      let apiSpec: object | undefined;

      switch (input.type) {
        case "CHATBOT":
          publicUrl = `${baseUrl}/embed/chat/${deployId}`;
          embedScript = generateChatbotWidget(deployId, baseUrl, input.config as Record<string, unknown>);
          break;
        case "FORM":
          publicUrl = `${baseUrl}/embed/form/${deployId}`;
          break;
        case "API_ENDPOINT":
          publicUrl = `${baseUrl}/api/deploy/${deployId}`;
          apiSpec = generateOpenApiSpec(input.name, deployId, baseUrl, workflow);
          break;
        case "SLACK_BOT":
          publicUrl = `${baseUrl}/webhooks/slack/${deployId}`;
          break;
        case "VOICE_BOT":
          publicUrl = `${baseUrl}/embed/voice/${deployId}`;
          break;
        case "SCHEDULED_JOB":
          publicUrl = `${baseUrl}/api/deploy/${deployId}`;
          break;
      }

      const deployment = await ctx.prisma.deployment.create({
        data: {
          workspaceId: ctx.workspaceId,
          workflowId: input.workflowId,
          name: input.name,
          type: input.type,
          config: input.config as any,
          publicUrl,
          embedScript,
          apiSpec: apiSpec as any,
        },
      });

      await ctx.prisma.auditLog.create({
        data: {
          workspaceId: ctx.workspaceId,
          userId: ctx.userId,
          action: "deployment.create",
          resourceType: "Deployment",
          resourceId: deployment.id,
          metadata: { type: input.type, name: input.name },
        },
      });

      return deployment;
    }),

  update: workspaceProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), config: z.record(z.unknown()).optional(), status: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.deployment.findFirst({ where: { id, workspaceId: ctx.workspaceId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      return ctx.prisma.deployment.update({ where: { id }, data: { ...data, config: data.config as any } });
    }),

  delete: workspaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.deployment.findFirst({ where: { id: input.id, workspaceId: ctx.workspaceId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      await ctx.prisma.deployment.update({ where: { id: input.id }, data: { deletedAt: new Date(), status: "deleted" } });
      return { success: true };
    }),
});

function generateChatbotWidget(deployId: string, baseUrl: string, config: Record<string, unknown>): string {
  return `<!-- FlowForge Chatbot Widget -->
<script>
(function() {
  var ff = window.FlowForge = window.FlowForge || {};
  ff.deployId = "${deployId}";
  ff.config = ${JSON.stringify({ baseUrl, primaryColor: config["primaryColor"] ?? "#6366f1", title: config["title"] ?? "Chat", position: config["position"] ?? "bottom-right" })};
  var s = document.createElement('script');
  s.src = "${baseUrl}/widget/chat.js";
  s.async = true;
  document.head.appendChild(s);
})();
</script>`;
}

function generateOpenApiSpec(name: string, deployId: string, baseUrl: string, _workflow: object): object {
  return {
    openapi: "3.0.0",
    info: { title: name, version: "1.0.0", description: `FlowForge workflow endpoint: ${name}` },
    servers: [{ url: `${baseUrl}/api/deploy/${deployId}` }],
    paths: {
      "/": {
        post: {
          summary: "Trigger workflow",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", description: "Workflow input data" } } },
          },
          responses: {
            "200": { description: "Execution started", content: { "application/json": { schema: { type: "object", properties: { executionId: { type: "string" } } } } } },
          },
          security: [{ bearerAuth: [] }],
        },
      },
    },
  };
}
