/// <reference types="node" />
import { generateKeyPairSync } from 'node:crypto';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { format: 'pem', type: 'pkcs8' },
    publicKeyEncoding: { format: 'pem', type: 'spki' },
});

const testEnv: Record<string, string> = {
    NODE_ENV: 'test',
    MONGODB_URI: 'mongodb://localhost:27017/rasbur-test',
    UPSTASH_REDIS_REST_URL: 'http://localhost:8079',
    UPSTASH_REDIS_REST_TOKEN: 'test-token',
    JWT_PUBLIC_KEY: publicKey,
    JWT_PRIVATE_KEY: privateKey,
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3001/auth/google/callback',
    GITHUB_CLIENT_ID: 'test-github-client-id',
    GITHUB_CLIENT_SECRET: 'test-github-client-secret',
    GITHUB_CALLBACK_URL: 'http://localhost:3001/auth/github/callback',
    FRONTEND_URL: 'http://localhost:5173',
};

for (const [key, value] of Object.entries(testEnv)) {
    process.env[key] = value;
}
