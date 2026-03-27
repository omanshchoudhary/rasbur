import { z } from 'zod';

// Decode Request
export const decodeRequestSchema = z.object({
    input: z.string().min(1, 'Input is required'),
    options: z
        .object({
            maxDepth: z.number().int().min(1).max(10).optional(),
            strictMode: z.boolean().optional(),
            forceDecoder: z.string().optional(),
        })
        .optional(),
});

// API Key
export const apiKeySchema = z.object({
    name: z.string().min(1).max(50),
    permission: z.array(z.enum(['decode', 'history', 'share'])),
    expiresAt: z.string().datetime().optional(),
});

// WebHook
export const webhookSchema = z.object({
    url: z.string().url(),
    events: z.array(z.enum(['decode.complete', 'decode.failed', 'file.processed'])),
});
