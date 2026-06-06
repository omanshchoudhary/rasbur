import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
    createApiKeyForUser,
    getApiKeyUsageForUser,
    listApiKeysForUser,
    revokeApiKeyForUser,
    updateApiKeyForUser,
} from '../services/apiKey.service.js';

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

export async function deleteApiKey(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'API key not found' });
    }

    try {
        const result = await revokeApiKeyForUser(userId, id);
        if (!result) {
            return res.status(404).json({ error: 'API key not found' });
        }
        return res.status(200).json({ ok: true, message: 'API key revoked successfully' });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

export async function updateApiKey(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    const { id } = req.params;
    if (!id || typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'API key not found' });
    }

    try {
        const apiKey = await updateApiKeyForUser(userId, id, req.body);
        if (!apiKey) {
            return res.status(404).json({ error: 'API key not found' });
        }
        return res.status(200).json({ ok: true, apiKey });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

export async function getApiKeyUsage(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized: User ID not found' });

    const { id } = req.params;
    if (!id || typeof id !== 'string' || !mongoose.isValidObjectId(id)) {
        return res.status(404).json({ error: 'API key not found' });
    }

    const usage = await getApiKeyUsageForUser(userId, id);
    if (!usage) return res.status(404).json({ error: 'API key not found' });
    return res.status(200).json({ ok: true, usage });
}
