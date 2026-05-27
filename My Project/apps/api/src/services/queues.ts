import { Queue } from "bullmq";

import { QUEUES } from "@flowforge/shared";

import redisClient from "./redis.js";

const connection = redisClient;

export const executionQueue = new Queue(QUEUES.WORKFLOW_EXECUTION, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 5000 },
    removeOnFail: { count: 5000 },
  },
});

export const schedulerQueue = new Queue(QUEUES.SCHEDULER, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 1000 },
  },
});

export const webhookIngressQueue = new Queue(QUEUES.WEBHOOK_INGRESS, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 10000 },
    removeOnFail: { count: 5000 },
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});

export const knowledgeQueue = new Queue(QUEUES.KNOWLEDGE_INGESTION, {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 1000 },
    attempts: 2,
  },
});
