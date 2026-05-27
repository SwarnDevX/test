import { Worker } from "bullmq";

import { QUEUES } from "@flowforge/shared";

import { redis } from "./redis.js";
import { handleExecution, handleTestNode } from "./executors/dag.js";
import { handleKnowledgeIngestion } from "./executors/knowledge.js";
import { handleWebhookIngress } from "./executors/webhook.js";
import { handleCronTrigger } from "./executors/scheduler.js";

export async function setupWorkers() {
  // Main execution worker
  new Worker(
    QUEUES.WORKFLOW_EXECUTION,
    async (job) => {
      if (job.name === "test-node") return handleTestNode(job.data);
      return handleExecution(job.data);
    },
    {
      connection: redis,
      concurrency: 10,
      limiter: { max: 50, duration: 1000 },
    },
  );

  // Knowledge ingestion worker
  new Worker(
    QUEUES.KNOWLEDGE_INGESTION,
    async (job) => handleKnowledgeIngestion(job.data),
    {
      connection: redis,
      concurrency: 5,
    },
  );

  // Webhook ingress worker
  new Worker(
    QUEUES.WEBHOOK_INGRESS,
    async (job) => handleWebhookIngress(job.data),
    {
      connection: redis,
      concurrency: 20,
    },
  );

  // Cron scheduler worker
  new Worker(
    QUEUES.SCHEDULER,
    async (job) => handleCronTrigger(job.data),
    {
      connection: redis,
      concurrency: 5,
    },
  );
}
