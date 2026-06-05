import type { NextFunction, Request, Response } from 'express';
import { hashApiKey } from '../services/apiKey.service.js';
import { ApiKey } from '../models/apiKey.js';
import { User } from '../models/user.js';

export async function apiKeyAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const rawKey = req.headers['x-api-key'];
    if (typeof rawKey !== 'string' || !rawKey.trim()) {
        return res.status(401).json({ error: 'Missing API key' });
    }

    try {
        const keyHash = hashApiKey(rawKey.trim());
        const apiKey = await ApiKey.findOne({ keyHash });

        const isExpired = apiKey?.expiresAt ? apiKey.expiresAt.getTime() < Date.now() : false;
        if (!apiKey || !apiKey.isActive || isExpired) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        const user = await User.findById(apiKey.userId);
        if (!user) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        req.user = { id: user.id, email: user.email, tier: user.tier };
        req.apiKey = {
            id: apiKey._id.toString(),
            permissions: apiKey.permissions as string[],
            rateLimit: apiKey.rateLimit,
        };
        req.authType = 'apikey';

        next();
    } catch {
        return res.status(401).json({ error: 'Invalid API key' });
    }
}
