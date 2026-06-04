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

export const identifyRequestSchema = z.object({
    input: z.string().min(1, 'Input is required'),
});

export const batchDecodeRequestSchema = z.object({
    inputs: z
        .array(z.string().min(1, 'Input is required'))
        .min(1, 'At least one input is required')
        .max(50, 'A maximum of 50 inputs is allowed'),
});

// API Key
export const apiKeySchema = z.object({
    name: z.string().min(1).max(50),
    permissions: z.array(z.enum(['decode', 'history', 'share', 'compare'])),
    expiresAt: z.string().datetime().optional(),
});

export const updateApiKeySchema = apiKeySchema.pick({ name: true, permissions: true }).partial();

// WebHook
export const webhookSchema = z.object({
    url: z.string().url(),
    events: z.array(z.enum(['decode.complete', 'decode.failed', 'file.processed'])),
});

// Restrict User For Changing Details
export const updateCurrentUserSchema = z
    .object({
        name: z.string().min(1).max(80).optional(),
        avatar: z.string().url().or(z.literal('')).nullable().optional(),
    })
    .refine((data) => data.name !== undefined || data.avatar !== undefined, {
        message: 'At least one field (name or avatar) must be provided',
    });

// To Save History In The DB
export const saveHistorySchema = z.object({
    originalInput: z.string().min(1),
    finalOutput: z.string().min(1),
    steps: z.array(
        z.object({
            decoderName: z.string(),
            confidence: z.number().min(0).max(1),
            input: z.string(),
            output: z.string(),
            explanation: z.string(),
        })
    ),
});

// To create a shared link
export const shareLinkSchema = z.object({
    historyId: z.string(),
    expiresInDays: z.number().int().positive().optional(),
});

// Compare Request Schema
export const compareRequestSchema = z.object({
    inputA: z.string().min(1),
    inputB: z.string().min(1),
    options: z
        .object({
            maxDepth: z.number().int().min(1).max(10).optional(),
            strictMode: z.boolean().optional(),
            forceDecoder: z.string().optional(),
        })
        .optional(),
});
