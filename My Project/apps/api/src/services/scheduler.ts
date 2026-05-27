import { QUEUES } from "@flowforge/shared";

import redisClient from "./redis.js";
import { Queue } from "bullmq";

const schedulerQueue = new Queue(QUEUES.SCHEDULER, {
  connection: redisClient,
});

export async function scheduleWorkflow(
  jobId: string,
  workflowId: string,
  workspaceId: string,
  cronExpr: string,
  timezone: string,
): Promise<string> {
  const key = `cron:${jobId}`;

  await schedulerQueue.add(
    "cron-trigger",
    { workflowId, workspaceId, scheduledJobId: jobId },
    {
      jobId: key,
      repeat: { pattern: cronExpr, tz: timezone },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 100 },
    },
  );

  return key;
}

export async function unscheduleWorkflow(bullJobId: string): Promise<void> {
  try {
    const repeatableJobs = await schedulerQueue.getRepeatableJobs();
    const job = repeatableJobs.find((j) => j.key === bullJobId);
    if (job) {
      await schedulerQueue.removeRepeatableByKey(job.key);
    }
  } catch {
    // Job may already be removed
  }
}
