import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'settings.json')
const ENV_PATH = path.join(process.cwd(), '.env.local')

interface Settings {
  openai_api_key: string
  model: string
  embedding_model: string
  max_tokens: number
  temperature: number
  demo_mode: boolean
}

const DEFAULTS: Settings = {
  openai_api_key: '',
  model: 'gpt-4o',
  embedding_model: 'text-embedding-3-small',
  max_tokens: 1500,
  temperature: 0.3,
  demo_mode: false,
}

function readSettings(): Settings {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) return { ...DEFAULTS, openai_api_key: process.env.OPENAI_API_KEY ?? '' }
    return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8')) }
  } catch {
    return { ...DEFAULTS, openai_api_key: process.env.OPENAI_API_KEY ?? '' }
  }
}

function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? '••••••••' : ''
  return key.slice(0, 4) + '••••••••••••••••' + key.slice(-4)
}

function writeEnvLocal(key: string, value: string) {
  try {
    let content = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, 'utf-8') : ''
    const regex = new RegExp(`^${key}=.*$`, 'm')
    const line = `${key}=${value}`
    if (regex.test(content)) {
      content = content.replace(regex, line)
    } else {
      content = content.trimEnd() + '\n' + line + '\n'
    }
    fs.writeFileSync(ENV_PATH, content, 'utf-8')
  } catch {
    // non-fatal
  }
}

export async function GET() {
  const settings = readSettings()
  const hasKey = !!(settings.openai_api_key || process.env.OPENAI_API_KEY)
  return NextResponse.json({
    ...settings,
    openai_api_key: maskKey(settings.openai_api_key || process.env.OPENAI_API_KEY || ''),
    has_api_key: hasKey,
    demo_mode: !hasKey || settings.demo_mode,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<Settings>
    const current = readSettings()
    const updated: Settings = { ...current }

    if (body.model !== undefined) updated.model = body.model
    if (body.embedding_model !== undefined) updated.embedding_model = body.embedding_model
    if (body.max_tokens !== undefined) updated.max_tokens = Number(body.max_tokens)
    if (body.temperature !== undefined) updated.temperature = Number(body.temperature)
    if (body.demo_mode !== undefined) updated.demo_mode = Boolean(body.demo_mode)

    // Handle API key separately — only update if a non-masked value is provided
    if (body.openai_api_key && !body.openai_api_key.includes('•')) {
      updated.openai_api_key = body.openai_api_key.trim()
      // Apply immediately to the running process
      process.env.OPENAI_API_KEY = updated.openai_api_key
      // Persist to .env.local
      writeEnvLocal('OPENAI_API_KEY', updated.openai_api_key)
    }

    if (!fs.existsSync(path.dirname(SETTINGS_PATH))) {
      fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true })
    }
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf-8')

    return NextResponse.json({ success: true, demo_mode: !updated.openai_api_key })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
