import type { Request, Response, NextFunction } from 'express';
import { importSPKI, jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { redis } from '../cache/redis.js';
import { User } from '../models/user.js';
import { logger } from '../logger.js';

async function tryAuthenticate(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return false;
    }
    const token = authHeader.slice('Bearer '.length).trim();

    try {
        const publicKey = await importSPKI(env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), 'RS256');
        const { payload } = await jwtVerify(token, publicKey, {
            algorithms: ['RS256'],
        });
        req.user = {
            id: payload.sub,
            email: payload.email,
            tier: payload.tier,
        };

        return true;
    } catch (err) {
        throw new Error('Invalid token');
    }
}

export async function usageLimitMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        let isAuthenticated = false;
        // If user is already authenticated
        if (req.user) {
            isAuthenticated = true;
        } else {
            try {
                isAuthenticated = await tryAuthenticate(req);
            } catch (err) {
                res.status(401).json({ error: 'Invalid token' });
                return;
            }
        }

        // Checking number of inputs given to decode
        let cost = 1;
        if (req.body && Array.isArray(req.body.inputs)) {
            cost = req.body.inputs.length;
        }

        const now = new Date();
        const midnight = new Date();
        // Make it 12 AM or 00:00:00
        midnight.setUTCHours(24, 0, 0, 0);

        const ttl = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000));

        // Anonymous User
        if (!isAuthenticated) {
            const ip = req.ip || 'unknown';
            const yyyymmdd = now.toISOString().split('T')[0];
            const key = `daily-decode:ip:${ip}:${yyyymmdd}`;
            const limit = 20;

            const count = await redis.incrby(key, cost);
            if (count === cost) {
                await redis.expire(key, 86400); // Set 24 hour key expiration
            }

            const remaining = Math.max(0, limit - count);
            res.setHeader('X-RateLimit-Limit', limit.toString());
            res.setHeader('X-RateLimit-Remaining', remaining.toString());
            res.setHeader('X-RateLimit-Reset', ttl.toString());

            // Limit Exceeded
            if (count > limit) {
                res.status(429).json({
                    error: 'Too Many Requests',
                    message:
                        'Daily decode limit of 20 requests exceeded. Please sign up or log in for higher limits.',
                });
                return;
            }
            next();
        } else {
            // Authenticated User
            const authUser = req.user as { id?: string } | undefined;
            const userId = authUser?.id;

            if (!userId) {
                res.status(401).json({ error: 'Unauthorized: User ID not found' });
                return;
            }
            const user = await User.findById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            const limit = user.tier === 'pro' ? Infinity : 200;

            // Lazy Reset Logic
            const lastReset = user.lastDecodeReset
                ? new Date(user.lastDecodeReset as any)
                : new Date(0);
            const needsReset =
                now.getUTCDate() !== lastReset.getUTCDate() ||
                now.getUTCMonth() !== lastReset.getUTCMonth() ||
                now.getUTCFullYear() !== lastReset.getUTCFullYear();

            const currentCount = needsReset ? 0 : user.dailyDecodeCount || 0;
            const newCount = currentCount + cost;

            const remaining = user.tier === 'pro' ? 999999 : Math.max(0, limit - newCount);
            res.setHeader(
                'X-RateLimit-Limit',
                user.tier === 'pro' ? 'unlimited' : limit.toString()
            );
            res.setHeader(
                'X-RateLimit-Remaining',
                user.tier === 'pro' ? 'unlimited' : remaining.toString()
            );
            res.setHeader('X-RateLimit-Reset', ttl.toString());

            if (user.tier !== 'pro' && newCount > limit) {
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: `Daily decode limit of ${limit} requests exceeded for free tier. Please upgrade to Pro for unlimited decodes.`,
                });
                return;
            }

            // Update user tracking details in database
            user.dailyDecodeCount = newCount;
            if (needsReset) {
                user.lastDecodeReset = now;
            }
            await user.save();

            next();
        }
    } catch (error) {
        logger.error({ err: error, path: req.originalUrl }, 'Usage limit verification failed');
        // Fail open so we do not block service on database/Redis connectivity issues
        next();
    }
}
