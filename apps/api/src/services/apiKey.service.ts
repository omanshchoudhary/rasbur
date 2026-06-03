import { ApiKey } from '../models/apiKey.js';
import crypto from 'crypto';
import type { CreateApiKeyInput, CreateApiKeyResult } from '@rasbur/shared';

export function generateRawApiKey(): string {
    return `rasbur_sk_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashApiKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export async function createApiKeyForUser(userId: string, input: CreateApiKeyInput): Promise<CreateApiKeyResult> {
    const rawKey = generateRawApiKey();
    const prefix = `rb_${rawKey.slice(-8)}`;

    const hash = hashApiKey(rawKey);

    const apiKey = await ApiKey.create({
        userId,
        name: input.name,
        keyHash: hash,
        prefix,
        permissions: input.permissions,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null
    });

    return {
        id: apiKey._id.toString(),
        name: apiKey.name,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions as ('decode' | 'history' | 'share' | 'compare')[],
        expiresAt: apiKey.expiresAt ?? null,
        isActive: apiKey.isActive,
        rawKey
    };
}
