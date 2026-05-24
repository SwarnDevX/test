import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
dotenv.config();

import generationRouter from './modules/generation/generation.router';
import analyticsRouter from './modules/analytics/analytics.router';
import authRouter from './modules/auth/auth.router';
import { errorHandler } from './middleware/errorHandler';
import redis from './config/redis';
import db from './config/db';

const app = express();
const PORT = process.env.PORT || 4000;

// Security & utility middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', async (_req, res) => {
  const [dbOk, redisOk] = await Promise.all([
    db.raw('SELECT 1').then(() => true).catch(() => false),
    redis.ping().then(() => true).catch(() => false),
  ]);
  res.json({ status: 'ok', db: dbOk, redis: redisOk, uptime: process.uptime() });
});

// Routes
app.use('/api/generate', generationRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/auth', authRouter);

// Global error handler
app.use(errorHandler);

async function start() {
  try {
    await redis.connect();
    console.log('✅ Redis connected');
    await db.raw('SELECT 1');
    console.log('✅ PostgreSQL connected');
    app.listen(PORT, () => {
      console.log(`🚀 API running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;

