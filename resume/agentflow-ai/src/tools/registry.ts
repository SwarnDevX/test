import type { ToolDefinition, ToolResult } from '../types'

class ToolRegistry {
  private tools = new Map<string, ToolDefinition>()

  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool)
  }

  unregister(name: string): void {
    this.tools.delete(name)
  }

  async execute(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name)
    if (!tool) {
      return { success: false, data: null, error: `Tool "${name}" not found` }
    }
    try {
      return await tool.execute(params)
    } catch (err) {
      return {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values())
  }

  getSchemas(): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    return this.getAll().map(({ name, description, parameters }) => ({
      name,
      description,
      parameters,
    }))
  }

  getOpenAIToolSchemas(): Array<{
    type: 'function'
    function: { name: string; description: string; parameters: object }
  }> {
    return this.getAll().map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: Object.fromEntries(
            Object.entries(tool.parameters).map(([key, param]) => [
              key,
              {
                type: param.type,
                description: param.description,
                ...(param.enum ? { enum: param.enum } : {}),
              },
            ]),
          ),
          required: Object.entries(tool.parameters)
            .filter(([, p]) => p.required !== false)
            .map(([k]) => k),
        },
      },
    }))
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }
}

export const toolRegistry = new ToolRegistry()
