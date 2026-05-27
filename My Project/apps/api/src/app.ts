import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { fastifyTRPCPlugin, type FastifyTRPCPluginOptions } from "@trpc/server/adapters/fastify";

import { createContext } from "./context.js";
import { webhookRouter } from "./routes/webhook.js";
import { appRouter, type AppRouter } from "./routers/index.js";
import { redisClient } from "./services/redis.js";

export async function buildApp(fastify: FastifyInstance) {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // handled by Next.js
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });

  await fastify.register(cors, {
    origin: process.env["NEXTAUTH_URL"] ?? "http://localhost:3000",
    credentials: true,
  });

  await fastify.register(cookie, {
    secret: process.env["AUTH_SECRET"] ?? "change-me",
  });

  await fastify.register(rateLimit, {
    redis: redisClient,
    max: 100,
    timeWindow: "1 minute",
    keyGenerator: (request) => {
      return (request.headers["x-workspace-id"] as string) ?? request.ip;
    },
  });

  await fastify.register(multipart, {
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  });

  // OpenAPI docs
  await fastify.register(swagger, {
    openapi: {
      info: { title: "FlowForge API", version: "0.1.0", description: "FlowForge public REST API" },
      servers: [{ url: process.env["API_URL"] ?? "http://localhost:3001" }],
      components: {
        securitySchemes: {
          bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
          apiKey: { type: "apiKey", in: "header", name: "X-Api-Key" },
        },
      },
    },
  });

  await fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: { docExpansion: "list", deepLinking: false },
  });

  // tRPC
  await fastify.register(fastifyTRPCPlugin, {
    prefix: "/trpc",
    useWSS: false,
    trpcOptions: {
      router: appRouter,
      createContext,
      onError: ({ path, error }) => {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          fastify.log.error(`tRPC error on ${path}: ${error.message}`);
        }
      },
    } satisfies FastifyTRPCPluginOptions<AppRouter>["trpcOptions"],
  });

  // Public webhook gateway (bypass auth)
  await fastify.register(webhookRouter, { prefix: "/webhooks" });

  // Health check
  fastify.get("/health", async () => ({
    status: "ok",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  }));

  return fastify;
}
