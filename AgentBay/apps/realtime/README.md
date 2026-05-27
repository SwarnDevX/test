# @agentbay/realtime

Socket.IO server for AgentBay's live task streaming. Workers publish progress to Redis pub/sub; this service fans it out to connected clients over WebSocket.

## Phase 7 features

- Auth via short-lived JWT issued by `apps/api`
- Channels: `task:{id}` — restricted to task owner, assigned agent, and admins
- Worker → Redis pub/sub → Socket.IO → browser
- Heartbeat, reconnection, and backpressure handling

## Development

```bash
pnpm --filter @agentbay/realtime dev   # start with hot reload on port 3002
```
