import type { ExpressionContext } from "./types.js";

const EXPRESSION_PATTERN = /\{\{([^}]+)\}\}/g;

function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce((current: unknown, key) => {
    if (current === null || current === undefined) return undefined;
    if (typeof current === "object" && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function resolveExpression(template: string, ctx: ExpressionContext): unknown {
  if (typeof template !== "string") return template;

  // If the entire string is a single expression, return its resolved type
  const singleMatch = template.match(/^\{\{([^}]+)\}\}$/);
  if (singleMatch?.[1]) {
    return resolvePathInContext(singleMatch[1].trim(), ctx);
  }

  // Otherwise, interpolate multiple expressions into a string
  return template.replace(EXPRESSION_PATTERN, (_, path: string) => {
    const value = resolvePathInContext(path.trim(), ctx);
    return value === null || value === undefined ? "" : String(value);
  });
}

function resolvePathInContext(path: string, ctx: ExpressionContext): unknown {
  // $nodeId.outputField → ctx.nodes[nodeId].outputField
  if (path.startsWith("nodes.") || /^[a-z][a-z0-9-]*\.[a-z]/i.test(path)) {
    const parts = path.split(".");
    const nodeId = parts[0] ?? "";
    const fieldPath = parts.slice(1).join(".");
    const nodeOutput = ctx.nodes[nodeId];
    return fieldPath ? resolvePath(nodeOutput, fieldPath) : nodeOutput;
  }

  // trigger.field
  if (path.startsWith("trigger.")) {
    return resolvePath(ctx.trigger, path.slice(8));
  }

  // variables.name
  if (path.startsWith("variables.")) {
    return resolvePath(ctx.variables, path.slice(10));
  }

  // env.NAME
  if (path.startsWith("env.")) {
    return ctx.env[path.slice(4)];
  }

  // execution.id
  if (path.startsWith("execution.")) {
    return resolvePath(ctx.execution, path.slice(10));
  }

  return undefined;
}
