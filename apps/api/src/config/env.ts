import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
    PORT: z
        .string()
        .default('3001')
        .transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;
