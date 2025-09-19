import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export const rateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const key = req.ip || 'unknown';
  const now = Date.now();
  
  // Clean up expired entries
  Object.keys(store).forEach(ip => {
    if (store[ip].resetTime < now) {
      delete store[ip];
    }
  });

  // Get or create entry for this IP
  if (!store[key]) {
    store[key] = {
      count: 1,
      resetTime: now + WINDOW_MS
    };
  } else {
    store[key].count++;
  }

  const { count, resetTime } = store[key];

  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': MAX_REQUESTS.toString(),
    'X-RateLimit-Remaining': Math.max(0, MAX_REQUESTS - count).toString(),
    'X-RateLimit-Reset': new Date(resetTime).toISOString()
  });

  // Check if limit exceeded
  if (count > MAX_REQUESTS) {
    logger.warn('Rate limit exceeded', {
      ip: key,
      count,
      limit: MAX_REQUESTS,
      url: req.url,
      method: req.method
    });

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((resetTime - now) / 1000)
    });
    return;
  }

  next();
};
