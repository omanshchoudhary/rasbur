import { redis } from '../cache/redis.js';
import { logger } from '../logger.js';

const WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS = 60;
const WEBSOCKET_RATE_LIMIT_MAX_EVENTS = 120;

type WebSocketRateLimitResult = {
    allowed: boolean;
    limit: number;
    remaining: number;
    resetSeconds: number;
};

export async function checkWebSocketRateLimit(userId: string): Promise<WebSocketRateLimitResult> {
    const windowStart = Math.floor(Date.now() / (WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS * 1000));
    const key = `rate-limit:websocket:user:${userId}:${windowStart}`;

    try {
        const count = await redis.incr(key);

        if (count === 1) {
            await redis.expire(key, WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS);
        }
        const remaining = Math.max(0, WEBSOCKET_RATE_LIMIT_MAX_EVENTS - count);
        return {
            allowed: count <= WEBSOCKET_RATE_LIMIT_MAX_EVENTS,
            limit: WEBSOCKET_RATE_LIMIT_MAX_EVENTS,
            remaining,
            resetSeconds: (windowStart + 1) * WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS,
        };
    } catch (error) {
        logger.error({ err: error, userId }, 'WebSocket rate limit check failed');

        return {
            allowed: true,
            limit: WEBSOCKET_RATE_LIMIT_MAX_EVENTS,
            remaining: WEBSOCKET_RATE_LIMIT_MAX_EVENTS,
            resetSeconds: (windowStart + 1) * WEBSOCKET_RATE_LIMIT_WINDOW_SECONDS,
        };
    }
}
