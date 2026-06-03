import type { Request, Response } from 'express';
import { createApiKeyForUser } from '../services/apiKey.service.js';

export async function createApiKey(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    const result = await createApiKeyForUser(userId, req.body);
    return res.status(201).json({ ok: true, apiKey: result });
}
