import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { SYSTEM_PROMPT } from "@/lib/prompt"
import type { GenerateRequest } from "@/lib/types"

export const maxDuration = 120

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "no_api_key", message: "ANTHROPIC_API_KEY is not set." },
      { status: 500 }
    )
  }

  let body: GenerateRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "parse", message: "Invalid JSON body." }, { status: 400 })
  }

  const { companyName, companyUrl, recipientName, background, mode } = body
  if (!companyName || !companyUrl || !background || !mode) {
    return NextResponse.json({ error: "parse", message: "Missing required fields." }, { status: 400 })
  }

  const userMessage = `Company name: ${companyName}
Company website: ${companyUrl}
Recipient name: ${recipientName || "(not provided — use a generic 'Hey there' or 'Hi team')"}
My background: ${background}
Output mode: ${mode}`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }]
  let finalText = ""
  const MAX_TURNS = 15

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }] as any,
        system: SYSTEM_PROMPT,
        messages,
      })

      messages.push({ role: "assistant", content: response.content })

      if (response.stop_reason === "end_turn") {
        const textBlocks = response.content.filter(
          (b): b is Anthropic.TextBlock => b.type === "text"
        )
        finalText = textBlocks.map((b) => b.text).join("")
        break
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(
          (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
        )
        if (toolUseBlocks.length === 0) break

        const toolResults: Anthropic.ToolResultBlockParam[] = toolUseBlocks.map((b) => ({
          type: "tool_result",
          tool_use_id: b.id,
          content: "",
        }))
        messages.push({ role: "user", content: toolResults })
        continue
      }

      // Unexpected stop reason — extract any text and break
      const textBlocks = response.content.filter(
        (b): b is Anthropic.TextBlock => b.type === "text"
      )
      if (textBlocks.length > 0) {
        finalText = textBlocks.map((b) => b.text).join("")
      }
      break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: "network", message }, { status: 502 })
  }

  if (!finalText) {
    return NextResponse.json(
      { error: "parse", raw: "", message: "No text content in response." },
      { status: 502 }
    )
  }

  // Extract JSON code block from the final text
  const jsonMatch = finalText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "parse", raw: finalText, message: "No JSON code block found in response." },
      { status: 502 }
    )
  }

  try {
    const parsed = JSON.parse(jsonMatch[1].trim())
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json(
      { error: "parse", raw: finalText, message: "Failed to parse JSON from response." },
      { status: 502 }
    )
  }
}
