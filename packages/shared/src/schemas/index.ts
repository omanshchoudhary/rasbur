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
    permission: z.array(z.enum(['decode', 'history', 'share'])),
    expiresAt: z.string().datetime().optional(),
});

// WebHook
export const webhookSchema = z.object({
    url: z.string().url(),
    events: z.array(z.enum(['decode.complete', 'decode.failed', 'file.processed'])),
});
