import type { Request, Response, NextFunction } from 'express';
import { jwtAuthMiddleware } from './auth.js';
import { apiKeyAuthMiddleware } from './apiKeyAuth.js';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    // Get the respective keys
    const hasBearer = req.headers.authorization?.startsWith('Bearer ');
    const hasApiKey = typeof req.headers['x-api-key'] === 'string';

    if (hasBearer) return jwtAuthMiddleware(req, res, next); // JWT wins if both sent
    if (hasApiKey) return apiKeyAuthMiddleware(req, res, next);
    return res.status(401).json({ error: 'Missing authentication credentials' });
}

// Authenticates when credentials are present, but lets anonymous requests through so
// public endpoints (decode/identify) work for signed-out users. Downstream
// usageLimitMiddleware applies a per-IP daily limit to anonymous callers.
export async function optionalAuthenticate(req: Request, res: Response, next: NextFunction) {
    const hasBearer = req.headers.authorization?.startsWith('Bearer ');
    const hasApiKey = typeof req.headers['x-api-key'] === 'string';

    if (hasBearer) return jwtAuthMiddleware(req, res, next);
    if (hasApiKey) return apiKeyAuthMiddleware(req, res, next);
    return next();
}

export function requirePermission(permission: 'decode' | 'history' | 'share' | 'compare') {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.authType !== 'apikey') return next(); // JWT (dashboard) users bypass, as no need to check permissions here
        if (!req.apiKey?.permissions.includes(permission)) {
            return res.status(403).json({ error: `API key lacks '${permission}' permission` });
        }
        next();
    };
}
