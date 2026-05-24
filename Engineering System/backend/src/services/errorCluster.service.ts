import crypto from "crypto";

export function computeClusterId(stackTrace: string): string {
  const normalized = stackTrace
    .replace(/:\d+:\d+/g, ":X:X")
    .replace(/0x[0-9a-f]+/gi, "0xXXXX")
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.Z]+/g, "TIMESTAMP")
    .replace(/node_modules\/[^\s]+/g, "node_modules/...")
    .trim();
  return crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function clusterErrors(errors: Array<{ id: string; stackTrace: string }>): Record<string, string[]> {
  const clusters = new Map<string, string[]>();
  for (const err of errors) {
    const cid = computeClusterId(err.stackTrace);
    if (!clusters.has(cid)) clusters.set(cid, []);
    clusters.get(cid)!.push(err.id);
  }
  return Object.fromEntries(clusters);
}

