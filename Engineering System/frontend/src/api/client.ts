import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

export function connectWebSocket(onMessage: (data: any) => void): WebSocket {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch {}
  };
  ws.onclose = () => {
    setTimeout(() => connectWebSocket(onMessage), 3000);
  };
  return ws;
}

