import type { Redis } from 'ioredis'

class InMemoryStore {
  private store = new Map<string, { value: string; expiresAt?: number }>()

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    })
  }

  async del(key: string): Promise<void> {
    this.store.delete(key)
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return Array.from(this.store.keys()).filter((k) => regex.test(k))
  }
}

type StoreBackend = InMemoryStore | Redis

let _store: StoreBackend | null = null

async function getStore(): Promise<StoreBackend> {
  if (_store) return _store

  if (process.env.REDIS_URL) {
    try {
      const { default: Redis } = await import('ioredis')
      const redis = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      })
      await redis.ping()
      _store = redis
      console.log('[Memory] Connected to Redis')
      return redis
    } catch {
      console.warn('[Memory] Redis unavailable — falling back to in-memory store')
    }
  }

  _store = new InMemoryStore()
  return _store
}

export const memoryStore = {
  async get(key: string): Promise<string | null> {
    const store = await getStore()
    return store.get(key)
  },

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const store = await getStore()
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    if ('set' in store && typeof (store as Redis).set === 'function' && ttlSeconds) {
      await (store as Redis).set(key, serialized, 'EX', ttlSeconds)
    } else if (store instanceof InMemoryStore) {
      await store.set(key, serialized, ttlSeconds)
    } else {
      await (store as Redis).set(key, serialized)
    }
  },

  async getJSON(key: string): Promise<unknown> {
    const raw = await this.get(key)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },

  async del(key: string): Promise<void> {
    const store = await getStore()
    await store.del(key)
  },

  async appendConversation(
    sessionId: string,
    message: { role: string; content: string },
  ): Promise<void> {
    const key = `conv:${sessionId}`
    const history = ((await this.getJSON(key)) as Array<{ role: string; content: string }> | null) ?? []
    history.push(message)
    // Keep last 20 messages
    const trimmed = history.slice(-20)
    await this.set(key, trimmed, 3600)
  },

  async getConversation(
    sessionId: string,
  ): Promise<Array<{ role: string; content: string }>> {
    return ((await this.getJSON(`conv:${sessionId}`)) as Array<{ role: string; content: string }> | null) ?? []
  },

  async setAgentState(traceId: string, state: unknown): Promise<void> {
    await this.set(`agent:${traceId}`, state, 300)
  },

  async getAgentState(traceId: string): Promise<unknown> {
    return this.getJSON(`agent:${traceId}`)
  },

  async incrementCounter(key: string, ttlSeconds = 86400): Promise<number> {
    const store = await getStore()
    if (!(store instanceof InMemoryStore)) {
      const result = await (store as Redis).incr(key)
      await (store as Redis).expire(key, ttlSeconds)
      return result
    }
    const current = parseInt((await store.get(key)) ?? '0', 10)
    const next = current + 1
    await store.set(key, String(next), ttlSeconds)
    return next
  },
}
