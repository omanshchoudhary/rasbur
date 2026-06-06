import { ApiKey } from '../models/apiKey.js';
import crypto from 'crypto';
import type {
    CreateApiKeyInput,
    CreateApiKeyResult,
    ApiKeyListItem,
    UpdateApiKeyInput,
    ApiKeyUsage,
} from '@rasbur/shared';
import { logger } from '../logger.js';
import { redis } from '../cache/redis.js';

export function generateRawApiKey(): string {
    return `rasbur_sk_${crypto.randomBytes(32).toString('hex')}`;
}

export function hashApiKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export async function createApiKeyForUser(
    userId: string,
    input: CreateApiKeyInput
): Promise<CreateApiKeyResult> {
    const rawKey = generateRawApiKey();
    // Leading, non-secret slice shown to users so they can identify a key
    // (namespace "rasbur_sk_" + first 8 chars of the random portion).
    const prefix = rawKey.slice(0, 18);

    const hash = hashApiKey(rawKey);

    const apiKey = await ApiKey.create({
        userId,
        name: input.name,
        keyHash: hash,
        prefix,
        permissions: input.permissions,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    });

    return {
        id: apiKey._id.toString(),
        name: apiKey.name,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions as ('decode' | 'history' | 'share' | 'compare')[],
        expiresAt: apiKey.expiresAt ?? null,
        isActive: apiKey.isActive,
        rawKey,
    };
}

export async function listApiKeysForUser(userId: string): Promise<ApiKeyListItem[]> {
    const apiKeys = await ApiKey.find({ userId }).sort({ createdAt: -1 });
    return apiKeys.map((apiKey) => ({
        id: apiKey._id.toString(),
        name: apiKey.name,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions as ('decode' | 'history' | 'share' | 'compare')[],
        expiresAt: apiKey.expiresAt ?? null,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt as Date,
    }));
}

export async function revokeApiKeyForUser(
    userId: string,
    keyId: string
): Promise<ApiKeyListItem | null> {
    const apiKey = await ApiKey.findOneAndUpdate(
        { _id: keyId, userId },
        { isActive: false },
        { new: true }
    );

    if (!apiKey) {
        return null;
    }
    return {
        id: apiKey._id.toString(),
        name: apiKey.name,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions as ('decode' | 'history' | 'share' | 'compare')[],
        expiresAt: apiKey.expiresAt ?? null,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt as Date,
    };
}

export async function updateApiKeyForUser(
    userId: string,
    keyId: string,
    input: UpdateApiKeyInput
): Promise<ApiKeyListItem | null> {
    const apiKey = await ApiKey.findOneAndUpdate(
        { _id: keyId, userId },
        { $set: input },
        { new: true }
    );

    if (!apiKey) {
        return null;
    }

    return {
        id: apiKey._id.toString(),
        name: apiKey.name,
        prefix: apiKey.prefix,
        permissions: apiKey.permissions as ('decode' | 'history' | 'share' | 'compare')[],
        expiresAt: apiKey.expiresAt ?? null,
        isActive: apiKey.isActive,
        createdAt: apiKey.createdAt as Date,
    };
}

export async function recordApiKeyUsage(keyId: string): Promise<void> {
    try {
        await ApiKey.updateOne(
            { _id: keyId },
            {
                $inc: { usageCount: 1 },
                $set: { lastUsedAt: new Date() },
            }
        );
    } catch (error) {
        logger.error({ err: error, keyId }, 'Failed to record API key usage');
    }
}

export async function getApiKeyUsageForUser(
    userId: string,
    keyId: string
): Promise<ApiKeyUsage | null> {
    const apiKey = await ApiKey.findOne({ _id: keyId, userId });

    if (!apiKey) return null;

    const yyyymmdd = new Date().toISOString().split('T')[0];
    const today = Number((await redis.get(`api-key:usage:${keyId}:${yyyymmdd}`)) ?? 0);

    const midnight = new Date();
    midnight.setUTCHours(24, 0, 0, 0);
    const resetSeconds = Math.max(0, Math.floor((midnight.getTime() - Date.now()) / 1000));

    return {
        keyId: apiKey.id,
        usageCount: apiKey.usageCount ?? 0,
        today,
        limit: apiKey.rateLimit,
        remaining: Math.max(0, apiKey.rateLimit - today),
        resetSeconds,
        lastUsedAt: apiKey.lastUsedAt ?? null,
    };
}
