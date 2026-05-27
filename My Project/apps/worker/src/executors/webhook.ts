import { prisma } from "@flowforge/db";
import { Queue } from "bullmq";
import { QUEUES } from "@flowforge/shared";
import { redis } from "../redis.js";

const executionQueue = new Queue(QUEUES.WORKFLOW_EXECUTION, { connection: redis });

interface WebhookIngressJob {
  webhookId?: string;
  deploymentId?: string;
  workflowId?: string;
  workspaceId: string;
  headers: Record<string, string>;
  body: unknown;
  query?: Record<string, unknown>;
  method: string;
  receivedAt: string;
}

export async function handleWebhookIngress(data: WebhookIngressJob): Promise<void> {
  const { workflowId, workspaceId, body, headers, query } = data;

  if (!workflowId) return;

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, workspaceId, isActive: true, deletedAt: null },
  });
  if (!workflow) return;

  const execution = await prisma.execution.create({
    data: {
      workflowId,
      workspaceId,
      status: "PENDING",
      trigger: "webhook",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      triggerData: { body, headers, query, method: data.method, receivedAt: data.receivedAt } as any,
    },
  });

  await executionQueue.add("execute", {
    executionId: execution.id,
    workflowId,
    workspaceId,
    definition: workflow.definition,
    triggerData: { body, headers, query },
  });
}
