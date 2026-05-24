import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redis from '../config/redis';
import { Request } from 'express';

function getTier(req: Request): 'free' | 'pro' {
  const user = (req as any).user;
  return user?.tier === 'pro' ? 'pro' : 'free';
}

export const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req: Request) => {
    const tier = getTier(req);
    return tier === 'pro'
      ? parseInt(process.env.RATE_LIMIT_PRO || '60')
      : parseInt(process.env.RATE_LIMIT_FREE || '5');
  },
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id || req.ip || 'anonymous';
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args) as any,
  }),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Rate limit exceeded. Upgrade to Pro for higher limits.',
    retryAfter: 3600,
  },
});

