import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketServer } from 'socket.io'

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/api/socketio',
    transports: ['websocket', 'polling'],
  })

  ;(global as unknown as Record<string, unknown>).socketServer = io

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    socket.on('join:session', (sessionId: string) => {
      socket.join(`session:${sessionId}`)
      socket.emit('joined', { sessionId })
    })

    socket.on('join:workflow', (runId: string) => {
      socket.join(`workflow:${runId}`)
      socket.emit('joined', { runId })
    })

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`)
    })
  })

  httpServer.listen(port, () => {
    console.log(`\n  ╔═════════════════════════════════════════╗`)
    console.log(`  ║   AgentFlow AI — Ready on :${port}         ║`)
    console.log(`  ╚═════════════════════════════════════════╝\n`)
    if (!process.env.OPENAI_API_KEY) {
      console.log('  ⚠  No OPENAI_API_KEY found — running in DEMO MODE\n')
    }
  })
})
