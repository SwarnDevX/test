import type { NodeCategory } from "@flowforge/shared";

import type { FlowForgePlugin, NodeManifest, NodeRegistryEntry } from "./types.js";

class NodeRegistry {
  private readonly nodes = new Map<string, NodeRegistryEntry>();

  register(manifest: NodeManifest, isBuiltIn = true, pluginId?: string): void {
    if (this.nodes.has(manifest.type)) {
      const existing = this.nodes.get(manifest.type);
      if (existing?.isBuiltIn && !isBuiltIn) {
        throw new Error(`Cannot override built-in node type: ${manifest.type}`);
      }
    }
    const entry: NodeRegistryEntry = {
      manifest,
      registeredAt: new Date(),
      isBuiltIn,
      ...(pluginId !== undefined ? { pluginId } : {}),
    };
    this.nodes.set(manifest.type, entry);
  }

  registerPlugin(plugin: FlowForgePlugin): void {
    for (const node of plugin.nodes) {
      this.register(node, false, plugin.id);
    }
  }

  unregisterPlugin(pluginId: string): void {
    for (const [type, entry] of this.nodes.entries()) {
      if (entry.pluginId === pluginId) {
        this.nodes.delete(type);
      }
    }
  }

  get(type: string): NodeManifest | undefined {
    return this.nodes.get(type)?.manifest;
  }

  getOrThrow(type: string): NodeManifest {
    const manifest = this.get(type);
    if (!manifest) throw new Error(`Unknown node type: ${type}`);
    return manifest;
  }

  getAll(): NodeManifest[] {
    return Array.from(this.nodes.values())
      .filter((e) => !e.manifest.isDeprecated)
      .map((e) => e.manifest);
  }

  getByCategory(category: NodeCategory): NodeManifest[] {
    return this.getAll().filter((m) => m.category === category);
  }

  search(query: string): NodeManifest[] {
    const q = query.toLowerCase();
    return this.getAll().filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.type.toLowerCase().includes(q),
    );
  }

  has(type: string): boolean {
    return this.nodes.has(type);
  }

  size(): number {
    return this.nodes.size;
  }
}

// Singleton registry — shared across the app
export const nodeRegistry = new NodeRegistry();
