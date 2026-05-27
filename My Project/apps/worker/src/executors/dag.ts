import { io } from "socket.io-client";
import { prisma } from "@flowforge/db";
import { nodeRegistry } from "@flowforge/nodes-sdk";
import type { WorkflowDefinition, WorkflowNode, ExecutionEvent, RetryPolicy } from "@flowforge/shared";
import { DEFAULT_RETRY_POLICY, SOCKET_ROOMS, calculateCost } from "@flowforge/shared";

// Import all built-in nodes to register them
import "../nodes/index.js";

const API_URL = process.env["API_URL"] ?? "http://localhost:3001";
const socket = io(API_URL, { transports: ["websocket"] });

interface ExecutionJobData {
  executionId: string;
  workflowId: string;
  workspaceId: string;
  definition: WorkflowDefinition;
  triggerData: Record<string, unknown>;
  startFromNodeId?: string;
  testMode?: boolean;
}

interface TestNodeJobData {
  executionId: string;
  workflowId: string;
  workspaceId: string;
  nodeId: string;
  nodeType: string;
  params: Record<string, unknown>;
  inputData: Record<string, unknown>;
}

function emit(event: ExecutionEvent) {
  socket.emit("execution:event", event);
  const room = SOCKET_ROOMS.execution(event.executionId);
  socket.emit("to-room", room, "execution:event", event);
}

export async function handleExecution(data: ExecutionJobData): Promise<void> {
  const { executionId, workflowId, workspaceId, definition, triggerData, startFromNodeId } = data;

  await prisma.execution.update({
    where: { id: executionId },
    data: { status: "RUNNING", startedAt: new Date() },
  });

  emit({ type: "execution_start", executionId, workflowId, timestamp: Date.now(), trigger: "job" });

  const nodeOutputs: Record<string, unknown> = {};
  const startMs = Date.now();
  let totalTokens = 0;
  let totalCostUsd = 0;

  try {
    // Build DAG
    const { layers } = buildExecutionLayers(definition, startFromNodeId);

    for (const layer of layers) {
      // Execute all nodes in this layer in parallel
      await Promise.all(
        layer.map((node) =>
          executeNode({
            node,
            executionId,
            workflowId,
            workspaceId,
            nodeOutputs,
            triggerData,
            definition,
            onCost: (tokens, cost) => {
              totalTokens += tokens;
              totalCostUsd += cost;
            },
          }),
        ),
      );
    }

    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        totalTokens,
        totalCostUsd,
      },
    });

    emit({
      type: "execution_done",
      executionId,
      workflowId,
      timestamp: Date.now(),
      durationMs: Date.now() - startMs,
      totalTokens,
      totalCostUsd,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";

    await prisma.execution.update({
      where: { id: executionId },
      data: { status: "FAILED", completedAt: new Date(), error: errorMsg },
    });

    emit({
      type: "execution_error",
      executionId,
      workflowId,
      timestamp: Date.now(),
      error: errorMsg,
    });
  }
}

async function executeNode({
  node,
  executionId,
  workflowId,
  workspaceId,
  nodeOutputs,
  triggerData,
  definition,
  onCost,
}: {
  node: WorkflowNode;
  executionId: string;
  workflowId: string;
  workspaceId: string;
  nodeOutputs: Record<string, unknown>;
  triggerData: Record<string, unknown>;
  definition: WorkflowDefinition;
  onCost: (tokens: number, cost: number) => void;
}): Promise<void> {
  const nodeData = node.data;

  // Skip muted nodes
  if (nodeData.isMuted) {
    emit({ type: "node_muted", executionId, workflowId, timestamp: Date.now(), nodeId: node.id });
    await prisma.executionStep.create({
      data: { executionId, nodeId: node.id, nodeType: node.type, nodeLabel: nodeData.label, status: "MUTED" },
    });
    return;
  }

  const step = await prisma.executionStep.create({
    data: {
      executionId,
      nodeId: node.id,
      nodeType: node.type,
      nodeLabel: nodeData.label,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  // Collect inputs from connected nodes
  const inputs = buildNodeInputs(node, nodeOutputs, triggerData, definition);

  emit({
    type: "node_start",
    executionId,
    workflowId,
    timestamp: Date.now(),
    nodeId: node.id,
    nodeType: node.type,
    inputData: inputs,
  });

  const retryPolicy: RetryPolicy = { ...DEFAULT_RETRY_POLICY, ...(nodeData.retryPolicy ?? {}) };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryPolicy.maxAttempts; attempt++) {
    if (attempt > 0) {
      const delay = Math.min(
        retryPolicy.baseDelay * Math.pow(2, attempt - 1),
        retryPolicy.maxDelay,
      );
      await sleep(delay);

      emit({
        type: "node_error",
        executionId,
        workflowId,
        timestamp: Date.now(),
        nodeId: node.id,
        error: `Retry attempt ${attempt}/${retryPolicy.maxAttempts}: ${lastError?.message ?? ""}`,
        retryAttempt: attempt,
      });
    }

    try {
      const manifest = nodeRegistry.getOrThrow(node.type);
      const startNodeMs = Date.now();

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 120_000); // 2min timeout

      let streamBuffer = "";
      const output = await manifest.executor({
        nodeId: node.id,
        workflowId,
        executionId,
        workspaceId,
        params: nodeData.config,
        inputs,
        signal: abortController.signal,
        emit: (event, payload) => {
          if (event === "stream:chunk") {
            const chunk = payload as string;
            streamBuffer += chunk;
            socket.emit("to-room", SOCKET_ROOMS.execution(executionId), "execution:event", {
              type: "node_stream",
              executionId,
              workflowId,
              timestamp: Date.now(),
              nodeId: node.id,
              chunk,
              done: false,
            } satisfies ExecutionEvent);
          }
        },
        getCredential: async (credentialId) => {
          const cred = await prisma.credential.findUniqueOrThrow({ where: { id: credentialId } });
          const { envelopeDecrypt, getMasterKey } = await import("@flowforge/shared");
          const plaintext = envelopeDecrypt({ encryptedData: cred.encryptedData, encryptedDek: cred.encryptedDek }, getMasterKey());
          return JSON.parse(plaintext) as Record<string, string>;
        },
        logger: {
          info: (msg) => console.warn(`[${node.id}] ${msg}`),
          warn: (msg) => console.warn(`[${node.id}] WARN: ${msg}`),
          error: (msg) => console.error(`[${node.id}] ERROR: ${msg}`),
        },
        resolveExpression: (template) => template, // basic passthrough; real impl in expression.ts
        env: Object.fromEntries(
          Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][],
        ),
      });

      clearTimeout(timeoutId);

      // Track tokens and cost
      if (output["__tokens"] !== undefined) {
        const tokens = output["__tokens"] as number;
        const model = output["__model"] as string | undefined;
        const cost = model ? calculateCost(model, Math.floor(tokens * 0.7), Math.floor(tokens * 0.3)) : 0;
        onCost(tokens, cost);

        await prisma.executionStep.update({
          where: { id: step.id },
          data: { tokens, costUsd: cost },
        });
      }

      // Store output in nodeOutputs map
      nodeOutputs[node.id] = output;

      await prisma.executionStep.update({
        where: { id: step.id },
        data: {
          status: "SUCCESS",
          outputData: output as object,
          inputData: inputs as object,
          retryCount: attempt,
          completedAt: new Date(),
        },
      });

      emit({
        type: "node_output",
        executionId,
        workflowId,
        timestamp: Date.now(),
        nodeId: node.id,
        outputData: output,
      });

      emit({
        type: "node_done",
        executionId,
        workflowId,
        timestamp: Date.now(),
        nodeId: node.id,
        status: "success",
        durationMs: Date.now() - startNodeMs,
      });

      return; // Success — exit retry loop
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt === retryPolicy.maxAttempts) {
        // Max retries reached
        await prisma.executionStep.update({
          where: { id: step.id },
          data: { status: "FAILED", error: lastError.message, retryCount: attempt, completedAt: new Date() },
        });

        emit({
          type: "node_done",
          executionId,
          workflowId,
          timestamp: Date.now(),
          nodeId: node.id,
          status: "failed",
          durationMs: 0,
        });

        if (retryPolicy.onError === "stop") {
          throw lastError;
        }
        // continue or branch — don't re-throw
        nodeOutputs[node.id] = { __error: lastError.message };
      }
    }
  }
}

function buildNodeInputs(
  node: WorkflowNode,
  nodeOutputs: Record<string, unknown>,
  triggerData: Record<string, unknown>,
  definition: WorkflowDefinition,
): Record<string, unknown> {
  const inputs: Record<string, unknown> = { trigger: triggerData };

  // Find edges targeting this node
  const incomingEdges = definition.edges.filter((e) => e.target === node.id);

  for (const edge of incomingEdges) {
    const sourceOutput = nodeOutputs[edge.source];
    if (sourceOutput !== undefined) {
      const key = edge.targetHandle ?? edge.source;
      inputs[key] = sourceOutput;
      // Merge if source output is an object
      if (typeof sourceOutput === "object" && sourceOutput !== null && !Array.isArray(sourceOutput)) {
        Object.assign(inputs, sourceOutput);
      }
    }
  }

  return inputs;
}

interface ExecutionLayers {
  layers: WorkflowNode[][];
  order: string[];
}

function buildExecutionLayers(definition: WorkflowDefinition, startFromNodeId?: string): ExecutionLayers {
  const { nodes, edges } = definition;

  // Build adjacency and in-degree maps
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    adjList.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // If startFromNodeId specified, only include reachable nodes
  let reachableNodeIds: Set<string>;
  if (startFromNodeId) {
    reachableNodeIds = new Set();
    const stack = [startFromNodeId];
    while (stack.length > 0) {
      const id = stack.pop()!;
      reachableNodeIds.add(id);
      for (const next of (adjList.get(id) ?? [])) {
        if (!reachableNodeIds.has(next)) stack.push(next);
      }
    }
  } else {
    reachableNodeIds = new Set(nodes.map((n) => n.id));
  }

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const layers: WorkflowNode[][] = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  // Start with nodes that have in-degree 0 (or startFromNodeId)
  if (startFromNodeId) {
    queue.push(startFromNodeId);
  } else {
    for (const [id, deg] of inDegree.entries()) {
      if (deg === 0 && reachableNodeIds.has(id)) queue.push(id);
    }
  }

  const order: string[] = [];

  while (queue.length > 0) {
    const layer: WorkflowNode[] = [];
    const nextQueue: string[] = [];

    for (const id of queue) {
      if (visited.has(id)) continue;
      visited.add(id);
      const node = nodeMap.get(id);
      if (node) {
        layer.push(node);
        order.push(id);
      }

      for (const next of (adjList.get(id) ?? [])) {
        if (!visited.has(next) && reachableNodeIds.has(next)) {
          const newDegree = (inDegree.get(next) ?? 1) - 1;
          inDegree.set(next, newDegree);
          if (newDegree === 0) nextQueue.push(next);
        }
      }
    }

    if (layer.length > 0) layers.push(layer);
    queue.push(...nextQueue);
  }

  return { layers, order };
}

export async function handleTestNode(data: TestNodeJobData): Promise<void> {
  const { executionId, workflowId, workspaceId, nodeId, nodeType, params, inputData } = data;

  const step = await prisma.executionStep.create({
    data: { executionId, nodeId, nodeType, nodeLabel: nodeType, status: "RUNNING", startedAt: new Date(), inputData: inputData as object },
  });

  try {
    const manifest = nodeRegistry.getOrThrow(nodeType);
    const output = await manifest.executor({
      nodeId,
      workflowId,
      executionId,
      workspaceId,
      params,
      inputs: inputData,
      signal: AbortSignal.timeout(60_000),
      emit: () => {},
      getCredential: async (credentialId) => {
        const cred = await prisma.credential.findUniqueOrThrow({ where: { id: credentialId } });
        const { envelopeDecrypt, getMasterKey } = await import("@flowforge/shared");
        return JSON.parse(envelopeDecrypt({ encryptedData: cred.encryptedData, encryptedDek: cred.encryptedDek }, getMasterKey())) as Record<string, string>;
      },
      logger: { info: console.warn, warn: console.warn, error: console.error },
      resolveExpression: (t) => t,
      env: process.env as Record<string, string>,
    });

    await prisma.executionStep.update({
      where: { id: step.id },
      data: { status: "SUCCESS", outputData: output as object, completedAt: new Date() },
    });

    await prisma.execution.update({ where: { id: executionId }, data: { status: "SUCCESS", completedAt: new Date() } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await prisma.executionStep.update({
      where: { id: step.id },
      data: { status: "FAILED", error: msg, completedAt: new Date() },
    });
    await prisma.execution.update({ where: { id: executionId }, data: { status: "FAILED", error: msg, completedAt: new Date() } });
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
