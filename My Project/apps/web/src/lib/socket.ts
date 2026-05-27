"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001", {
      transports: ["websocket"],
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  socket?.disconnect();
}

export function joinExecutionRoom(executionId: string) {
  const s = getSocket();
  s.emit("join-room", `execution:${executionId}`);
}

export function leaveExecutionRoom(executionId: string) {
  const s = getSocket();
  s.emit("leave-room", `execution:${executionId}`);
}
