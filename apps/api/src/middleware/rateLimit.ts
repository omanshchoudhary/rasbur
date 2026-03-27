import type { NextFunction, Request, Response } from 'express';
import { redis } from '../cache/redis.js';
import { logger } from '../logger.js';

type RequestWithId = Request & {
    requestId?: string;
};

const WINDOW_MS = 60 * 1000;
const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 100;

export const rateLimitMiddleware = async (
    req: RequestWithId,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ip = req.ip || 'unknown';
        const windowStart = Math.floor(Date.now() / WINDOW_MS);
        const resetTime = (windowStart + 1) * WINDOW_SECONDS;
        const key = `rate-limit:ip:${ip}:${windowStart}`;

        const count = await redis.incr(key);

        if (count === 1) {
            await redis.expire(key, WINDOW_SECONDS);
        }

        const remaining = Math.max(0, MAX_REQUESTS - count);

        res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        res.setHeader('X-RateLimit-Reset', resetTime.toString());

        if (count > MAX_REQUESTS) {
            res.status(429).json({
                status: 'error',
                message: 'Too many requests',
                requestId: req.requestId,
            });
            return;
        }

        next();
    } catch (error) {
        logger.error(
            {
                err: error,
                requestId: req.requestId,
                path: req.originalUrl,
                method: req.method,
            },
            'Rate limit check failed'
        );

        next();
    }
};
