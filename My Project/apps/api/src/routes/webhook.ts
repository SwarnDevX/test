import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "@flowforge/db";
import { verifyWebhookSignature } from "@flowforge/shared";

import { webhookIngressQueue } from "../services/queues.js";

export async function webhookRouter(fastify: FastifyInstance) {
  // Handle incoming webhooks: POST /webhooks/:id
  fastify.post<{ Params: { id: string } }>("/:id", {
    schema: {
      params: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
    },
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const webhookId = request.params.id;

      const webhook = await prisma.webhook.findFirst({
        where: { url: { endsWith: webhookId }, isActive: true },
      });

      if (!webhook) {
        return reply.status(404).send({ error: "Webhook not found" });
      }

      // Verify signature if present
      const signature = request.headers["x-hub-signature-256"] as string | undefined
        ?? request.headers["x-flowforge-signature"] as string | undefined;

      if (signature && webhook.secretHash) {
        const body = JSON.stringify(request.body);
        const isValid = verifyWebhookSignature(body, signature, webhook.secretHash);
        if (!isValid) {
          return reply.status(401).send({ error: "Invalid signature" });
        }
      }

      // Enqueue for processing
      await webhookIngressQueue.add("webhook", {
        webhookId: webhook.id,
        workflowId: webhook.workflowId,
        workspaceId: webhook.workspaceId,
        headers: request.headers,
        body: request.body,
        query: request.query,
        method: request.method,
        receivedAt: new Date().toISOString(),
      });

      // Update stats
      await prisma.webhook.update({
        where: { id: webhook.id },
        data: { totalReceived: { increment: 1 }, lastReceivedAt: new Date() },
      });

      return reply.status(202).send({ received: true, webhookId: webhook.id });
    },
  });

  // Deployed API endpoint handler: POST /deploy/:id
  fastify.all<{ Params: { id: string } }>("/deploy/:id", async (request, reply) => {
    const deployId = request.params.id;

    const deployment = await prisma.deployment.findFirst({
      where: { publicUrl: { endsWith: deployId }, status: "active", type: "API_ENDPOINT" },
      include: { workflow: true },
    });

    if (!deployment) return reply.status(404).send({ error: "Endpoint not found" });

    // Auth check via Bearer or API key
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) return reply.status(401).send({ error: "Authentication required" });

    await webhookIngressQueue.add("api-endpoint", {
      deploymentId: deployment.id,
      workflowId: deployment.workflowId,
      workspaceId: deployment.workspaceId,
      body: request.body,
      headers: request.headers,
      method: request.method,
    });

    return reply.status(202).send({ executionId: "pending", status: "queued" });
  });
}
