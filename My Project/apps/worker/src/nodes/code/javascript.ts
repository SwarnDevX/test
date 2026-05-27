import { nodeRegistry } from "@flowforge/nodes-sdk";
import vm from "node:vm";

nodeRegistry.register({
  type: "code.javascript",
  category: "CODE",
  label: "JavaScript",
  description: "Execute sandboxed JavaScript code",
  icon: "Terminal",
  color: "oklch(65% 0.15 180)",
  inputs: [{ name: "input", label: "Input", type: "ANY" }],
  outputs: [
    { name: "result", label: "Result", type: "ANY" },
    { name: "stdout", label: "Console Output", type: "STRING" },
  ],
  parameters: [
    { name: "code", label: "Code", type: "string", default: "// Available: inputs, env\nreturn { result: inputs };" },
    { name: "timeout", label: "Timeout (ms)", type: "number", default: 30000 },
  ],
  executor: async (ctx) => {
    const code = String(ctx.params.code ?? "return {};");
    const timeout = Math.min(Number(ctx.params.timeout ?? 30_000), 60_000);

    const logs: string[] = [];
    const filteredEnv = Object.fromEntries(
      Object.entries(ctx.env ?? {}).filter(
        ([k]) => !k.toLowerCase().includes("secret") && !k.toLowerCase().includes("key"),
      ),
    );

    const sandbox = {
      inputs: ctx.inputs ?? {},
      env: filteredEnv,
      console: {
        log: (...args: unknown[]) => logs.push(args.map(String).join(" ")),
        warn: (...args: unknown[]) => logs.push("WARN: " + args.map(String).join(" ")),
        error: (...args: unknown[]) => logs.push("ERROR: " + args.map(String).join(" ")),
      },
      __result: undefined as unknown,
    };
    vm.createContext(sandbox);

    const wrappedCode = `
      (async function(inputs, env) {
        ${code}
      })(inputs, env).then(r => { __result = r; });
    `;

    const script = new vm.Script(wrappedCode);
    await script.runInContext(sandbox, { timeout });

    // Give microtasks a tick to settle
    await new Promise<void>((r) => setImmediate(r));

    return {
      result: sandbox.__result ?? {},
      stdout: logs.join("\n"),
    };
  },
});
