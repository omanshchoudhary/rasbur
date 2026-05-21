import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
    MONGODB_URI: z.string().min(1, 'MongoDB URI is required'),
    PORT: z
        .string()
        .default('3001')
        .transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    UPSTASH_REDIS_REST_URL: z.string().url('Upstash Redis REST URL is required'),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'Upstash Redis REST token is required'),
    JWT_PUBLIC_KEY: z.string().min(1, 'JWT public key is required'),
    GOOGLE_CLIENT_ID: z.string().min(1, 'Google client ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google client secret is required'),
    GOOGLE_CALLBACK_URL: z.string().url('Google callback URL must be a valid URL'),
    GITHUB_CLIENT_ID: z.string().min(1, 'GitHub client ID is required'),
    GITHUB_CLIENT_SECRET: z.string().min(1, 'GitHub client secret is required'),
    GITHUB_CALLBACK_URL: z.string().url('GitHub callback URL must be a valid URL'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
}

export const env = parsed.data;
