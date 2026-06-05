import type { NextFunction, Request, Response } from 'express';
import { redis } from '../cache/redis.js';
import { logger } from '../logger.js';

export async function apiKeyRateLimit(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    if (req.authType !== 'apikey' || !req.apiKey) {
        next();
        return;
    }

    try {
        const apiKeyId = req.apiKey.id;
        const limit = req.apiKey.rateLimit;

        const now = new Date();
        const yyyymmdd = now.toISOString().split('T')[0];
        const key = `api-key:usage:${apiKeyId}:${yyyymmdd}`;

        const midnight = new Date();
        midnight.setUTCHours(24, 0, 0, 0);
        const ttl = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000));

        const count = await redis.incr(key);
        if (count === 1) {
            await redis.expire(key, ttl || 86400);
        }

        const remaining = Math.max(0, limit - count);
        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', ttl.toString());

        if (count > limit) {
            res.status(429).json({
                error: 'Too Many Requests',
                message: `API key daily rate limit of ${limit} requests exceeded.`,
            });
            return;
        }

        next();
    } catch (error) {
        logger.error({ err: error, path: req.originalUrl }, 'API key rate limiting failed');
        next();
    }
}
