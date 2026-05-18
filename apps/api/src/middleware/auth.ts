import { jwtVerify, importSPKI } from 'jose';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';

export async function jwtAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    // Token not present
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing token' });
    }

    // Extracting the token
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
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
