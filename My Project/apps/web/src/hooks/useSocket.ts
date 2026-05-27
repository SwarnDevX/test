"use client";

import { useEffect, useRef } from "react";
import { type Socket } from "socket.io-client";
import { connectSocket, joinExecutionRoom, leaveExecutionRoom } from "@/lib/socket";
import { useExecutionStore } from "@/stores/execution.store";
import type { ExecutionEvent } from "@flowforge/shared";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = connectSocket();
    return () => {
      // Keep socket alive across re-renders; only disconnect on full unmount
    };
  }, []);

  return socketRef.current;
}

export function useExecutionSocket(executionId: string | null) {
  const applyEvent = useExecutionStore((s) => s.applyEvent);

  useEffect(() => {
    if (!executionId) return;
    const socket = connectSocket();
    joinExecutionRoom(executionId);

    const handler = (event: ExecutionEvent) => {
      if (event.executionId === executionId) {
        applyEvent(event);
      }
    };

    socket.on("execution:event", handler);

    return () => {
      socket.off("execution:event", handler);
      leaveExecutionRoom(executionId);
    };
  }, [executionId, applyEvent]);
}
