import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

let wss: WebSocketServer;
const clients = new Set<WebSocket>();

export function setupWebSocket(server: HttpServer): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    clients.add(ws);
    console.log(`🔌 WebSocket client connected (total: ${clients.size})`);

    ws.send(JSON.stringify({
      type: "connected",
      message: "Real-time updates active",
      timestamp: new Date().toISOString(),
    }));

    ws.on("close", () => {
      clients.delete(ws);
      console.log(`🔌 WebSocket client disconnected (total: ${clients.size})`);
    });

    ws.on("error", () => {
      clients.delete(ws);
    });
  });
}

export function broadcastUpdate(issueId: string, status: string, message: string): void {
  const payload = JSON.stringify({
    type: "issue_update",
    issueId,
    status,
    message,
    timestamp: new Date().toISOString(),
  });

  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

