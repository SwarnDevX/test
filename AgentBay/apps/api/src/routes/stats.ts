import { Hono } from 'hono';
import { getPlatformStats } from '../services/stats.service.js';

const stats = new Hono();

stats.get('/', async (c) => {
  const data = await getPlatformStats();
  return c.json({ ok: true, data });
});

export default stats;
