"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import api from "@/lib/api";

export interface TestCaseResult {
  caseIndex: number;
  verdict: string;
  actualOutput: string;
  expectedOutput: string;
  stderr: string;
  runtimeMs: number;
}

export interface VerdictPayload {
  submissionId: number;
  userId: number;
  verdict: string;
  testcasesPassed: number;
  totalTestcases: number;
  failingTestcaseIndex: number | null;
  runtimeMs: number | null;
  memoryKb: number | null;
  compileError: string | null;
  results: TestCaseResult[];
}

export interface SubmissionState {
  submissionId: number | null;
  status: "idle" | "submitting" | "queued" | "running" | "done";
  verdict: VerdictPayload | null;
  error: string | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function useSubmission() {
  const stompRef = useRef<Client | null>(null);
  const [state, setState] = useState<SubmissionState>({
    submissionId: null,
    status: "idle",
    verdict: null,
    error: null,
  });

  // Connect STOMP once on mount
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
      reconnectDelay: 5000,
    });
    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); };
  }, []);

  const subscribe = useCallback((submissionId: number) => {
    const stomp = stompRef.current;
    if (!stomp) return;

    const waitAndSubscribe = () => {
      stomp.subscribe(`/topic/submissions/${submissionId}`, (msg) => {
        const payload: VerdictPayload = JSON.parse(msg.body);
        setState(s => ({
          ...s,
          status: "done",
          verdict: payload,
        }));
      });
    };

    if (stomp.connected) {
      waitAndSubscribe();
    } else {
      stomp.onConnect = () => waitAndSubscribe();
    }
  }, []);

  const submit = useCallback(async (
    slug: string,
    language: string,
    sourceCode: string
  ) => {
    setState({ submissionId: null, status: "submitting", verdict: null, error: null });

    try {
      const res = await api.post(`/problems/${slug}/submit`, { language, sourceCode });
      const { id } = res.data;
      setState(s => ({ ...s, submissionId: id, status: "queued" }));
      subscribe(id);
    } catch (err: unknown) {
      setState(s => ({
        ...s,
        status: "idle",
        error: err instanceof Error ? err.message : "Submit failed",
      }));
    }
  }, [subscribe]);

  const reset = useCallback(() => {
    setState({ submissionId: null, status: "idle", verdict: null, error: null });
  }, []);

  return { state, submit, reset };
}
