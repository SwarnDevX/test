import { router } from "../trpc.js";
import { adminRouter } from "./admin.js";
import { apiKeyRouter } from "./api-key.js";
import { auditLogRouter } from "./audit-log.js";
import { authRouter } from "./auth.js";
import { credentialRouter } from "./credential.js";
import { deploymentRouter } from "./deployment.js";
import { executionRouter } from "./execution.js";
import { folderRouter } from "./folder.js";
import { knowledgeRouter } from "./knowledge.js";
import { scheduledJobRouter } from "./scheduled-job.js";
import { templateRouter } from "./template.js";
import { webhookRouter } from "./webhook.js";
import { workflowRouter } from "./workflow.js";
import { workspaceRouter } from "./workspace.js";

export const appRouter = router({
  auth: authRouter,
  workspace: workspaceRouter,
  workflow: workflowRouter,
  execution: executionRouter,
  credential: credentialRouter,
  knowledge: knowledgeRouter,
  deployment: deploymentRouter,
  template: templateRouter,
  apiKey: apiKeyRouter,
  webhook: webhookRouter,
  scheduledJob: scheduledJobRouter,
  auditLog: auditLogRouter,
  folder: folderRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
