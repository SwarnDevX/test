import { prisma } from "@flowforge/db";
import { Queue } from "bullmq";
import { QUEUES } from "@flowforge/shared";
import { redis } from "../redis.js";

const executionQueue = new Queue(QUEUES.WORKFLOW_EXECUTION, { connection: redis });

interface CronTriggerJob {
  workflowId: string;
  workspaceId: string;
  scheduledJobId: string;
}

export async function handleCronTrigger(data: CronTriggerJob): Promise<void> {
  const { workflowId, workspaceId, scheduledJobId } = data;

  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, workspaceId, isActive: true, deletedAt: null },
  });
  if (!workflow) return;

  const scheduledJob = await prisma.scheduledJob.findUnique({ where: { id: scheduledJobId } });
  if (!scheduledJob?.isActive) return;

  const execution = await prisma.execution.create({
    data: {
      workflowId,
      workspaceId,
      status: "PENDING",
      trigger: "schedule",
      triggerData: { scheduledJobId, triggeredAt: new Date().toISOString() },
    },
  });

  await executionQueue.add("execute", {
    executionId: execution.id,
    workflowId,
    workspaceId,
    definition: workflow.definition,
    triggerData: { scheduledJobId },
  });

  await prisma.scheduledJob.update({
    where: { id: scheduledJobId },
    data: { lastRunAt: new Date(), totalRuns: { increment: 1 } },
  });
}
