import type { Request, Response } from 'express';
import { createApiKeyForUser, listApiKeysForUser } from '../services/apiKey.service.js';

export async function createApiKey(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    const result = await createApiKeyForUser(userId, req.body);
    return res.status(201).json({ ok: true, apiKey: result });
}

export async function listApiKeys(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    const apiKeys = await listApiKeysForUser(userId);

    return res.status(200).json({ ok: true, apiKeys });
}
