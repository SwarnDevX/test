import express from "express";
import cors from "cors";
import http from "http";
import { config } from "./config/index.js";
import { connectDB } from "./config/db.js";
import { routes } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { setupWebSocket } from "./websocket/errorListener.js";
import { initEmbeddingStore } from "./utils/embeddings.js";

const app = express();

// ── Middleware ──
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// ── Routes ──
app.use("/api", routes);

// ── Error Handler ──
app.use(errorHandler);

// ── Server ──
const server = http.createServer(app);
setupWebSocket(server);

async function start() {
  await connectDB();
  await initEmbeddingStore();

  server.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║  🚀 Self-Healing Platform Backend               ║
║  🌐 API:       http://localhost:${config.port}/api    ║
║  🔌 WebSocket: ws://localhost:${config.port}/ws       ║
║  📊 Health:    http://localhost:${config.port}/api/health ║
║  🔧 Env:       ${config.nodeEnv}                      ║
╚══════════════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});

