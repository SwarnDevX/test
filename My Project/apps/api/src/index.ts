import { fastify } from "fastify";

import { buildApp } from "./app.js";

const server = fastify({
  logger: {
    level: process.env["LOG_LEVEL"] ?? "info",
    transport:
      process.env["NODE_ENV"] === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
});

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);
const HOST = process.env["HOST"] ?? "0.0.0.0";

async function main() {
  try {
    await buildApp(server);
    await server.listen({ port: PORT, host: HOST });
    server.log.info(`FlowForge API running on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
