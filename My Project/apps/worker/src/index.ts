import { setupWorkers } from "./workers.js";

console.warn("FlowForge Worker starting...");

async function main() {
  await setupWorkers();
  console.warn("Workers ready.");
}

main().catch((err) => {
  console.error("Worker startup error:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.warn("SIGTERM received, shutting down workers...");
  process.exit(0);
});
