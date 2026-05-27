import { nodeRegistry } from "@flowforge/nodes-sdk";
import { Worker } from "worker_threads";

nodeRegistry.register({
  type: "code.python",
  category: "CODE",
  label: "Python",
  description: "Execute sandboxed Python code via Pyodide WASM",
  icon: "FileCode",
  color: "oklch(65% 0.15 180)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "result", label: "Result", type: "ANY" },
    { name: "stdout", label: "Console Output", type: "STRING" },
  ],
  parameters: [
    { name: "code", label: "Code", type: "string", default: "# Available: inputs dict, env dict\nresult = inputs" },
    { name: "timeout", label: "Timeout (ms)", type: "number", default: 30000 },
  ],
  executor: async (ctx) => {
    const code = String(ctx.params.code ?? "result = inputs");
    const timeout = Math.min(Number(ctx.params.timeout ?? 30_000), 60_000);

    return new Promise<{ result: unknown; stdout: string }>((resolve, reject) => {
      const workerCode = `
const { workerData, parentPort } = require('worker_threads');
const { code, inputs, timeout } = workerData;

// Load Pyodide in WASM environment
async function run() {
  try {
    const { loadPyodide } = require('pyodide');
    const py = await loadPyodide();

    py.globals.set('inputs', py.toPy(inputs));

    const logs = [];
    py.setStdout({ batched: (s) => logs.push(s) });
    py.setStderr({ batched: (s) => logs.push('ERR: ' + s) });

    await py.runPythonAsync(code);

    const result = py.globals.get('result');
    parentPort.postMessage({
      success: true,
      result: result ? py.toPy(result) : null,
      stdout: logs.join('\\n')
    });
  } catch (err) {
    parentPort.postMessage({ success: false, error: err.message });
  }
}
run();
`;
      // For environments where Pyodide isn't available, fall back gracefully
      try {
        const worker = new Worker(workerCode, {
          eval: true,
          workerData: { code, inputs: ctx.inputs, timeout },
          resourceLimits: { maxOldGenerationSizeMb: 512, maxYoungGenerationSizeMb: 64 },
        });

        const timer = setTimeout(() => {
          void worker.terminate();
          reject(new Error(`Python execution timed out after ${timeout}ms`));
        }, timeout);

        worker.on("message", (msg: { success: boolean; result?: unknown; stdout?: string; error?: string }) => {
          clearTimeout(timer);
          if (msg.success) {
            resolve({ result: msg.result ?? null, stdout: msg.stdout ?? "" });
          } else {
            reject(new Error(msg.error ?? "Python execution failed"));
          }
        });

        worker.on("error", (err) => { clearTimeout(timer); reject(err); });
      } catch {
        // Pyodide not available — simulate with a clear error
        reject(new Error("Python execution requires Pyodide to be installed: npm install pyodide"));
      }
    });
  },
});
