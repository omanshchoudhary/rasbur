import { Redis } from '@upstash/redis';
import { env } from '../config/env.js';
import { logger } from '../logger.js';

export const redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
});

export const checkRedisConnection = async (): Promise<void> => {
    try {
        await redis.set('health:redis', 'ok', { ex: 10 });
        const value = await redis.get('health:redis');
        if (value !== 'ok') {
            throw new Error('Redis health check returned unexpected value');
        }

        logger.info('Redis connected');
    } catch (error) {
        logger.error({ err: error }, 'Redis connection failed');
        throw error;
    }
};
