import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { importPKCS8, SignJWT } from 'jose';
import { app } from './app.js';
import { env } from './config/env.js';

const JWT_ALG = 'RS256';
let privateKey: any;
let publicKeyPem: string;

async function createToken(
    userId = 'test-user-1',
    email = 'test@example.com',
    tier = 'free'
): Promise<string> {
    return new SignJWT({
        email,
        tier,
    })
        .setProtectedHeader({ alg: JWT_ALG })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(privateKey);
}

const redisMockState = vi.hoisted(() => ({
    counters: new Map<string, number>(),
}));

vi.mock('./cache/redis.js', () => ({
    redis: {
        expire: vi.fn(async () => 1),
        get: vi.fn(async () => 'ok'),
        incr: vi.fn(async (key: string) => {
            const nextCount = (redisMockState.counters.get(key) ?? 0) + 1;
            redisMockState.counters.set(key, nextCount);
            return nextCount;
        }),
        incrby: vi.fn(async (key: string, amount: number) => {
            const nextCount = (redisMockState.counters.get(key) ?? 0) + amount;
            redisMockState.counters.set(key, nextCount);
            return nextCount;
        }),
        set: vi.fn(async () => 'OK'),
    },
}));

vi.mock('./models/user.js', () => ({
    User: {
        findById: vi.fn(async (id: string) => {
            if (id === 'test-user-1') {
                return {
                    id: 'test-user-1',
                    name: 'Test User',
                    email: 'test@example.com',
                    avatar: 'avatar-url',
                    tier: 'free',
                    dailyDecodeCount: 5,
                    lastDecodeReset: new Date(),
                    save: vi.fn(async () => {}),
                };
            }
            return null;
        }),
    },
}));

const mockApiKeys = [
    {
        _id: '507f1f77bcf86cd799439011',
        userId: 'test-user-1',
        name: 'Default Key',
        keyHash: 'hash-value-1',
        prefix: 'rasbur_sk_default',
        permissions: ['decode', 'history'],
        rateLimit: 1000,
        expiresAt: null,
        lastUsedAt: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

vi.mock('./models/apiKey.js', () => {
    return {
        ApiKey: {
            create: vi.fn(async (data: any) => ({
                _id: 'test-key-new',
                isActive: true,
                ...data,
            })),
            find: vi.fn(() => ({
                sort: vi.fn().mockImplementation(async () => mockApiKeys),
            })),
            findOne: vi.fn(async (query: any) => {
                if (query.keyHash === 'valid-hash') {
                    return {
                        _id: '507f1f77bcf86cd799439011',
                        userId: 'test-user-1',
                        name: 'Default Key',
                        keyHash: 'valid-hash',
                        prefix: 'rasbur_sk_default',
                        permissions: ['decode', 'history'],
                        rateLimit: 2,
                        expiresAt: null,
                        isActive: true,
                    };
                }
                return null;
            }),
            findOneAndUpdate: vi.fn(async (query: any, update: any) => {
                if (query._id === '507f1f77bcf86cd799439011') {
                    return {
                        _id: '507f1f77bcf86cd799439011',
                        userId: 'test-user-1',
                        name: 'Updated Key',
                        keyHash: 'hash-value-1',
                        prefix: 'rasbur_sk_default',
                        permissions: ['decode'],
                        rateLimit: 1000,
                        expiresAt: null,
                        isActive: update.isActive !== undefined ? update.isActive : true,
                        createdAt: new Date(),
                    };
                }
                return null;
            }),
        },
    };
});

vi.mock('./services/apiKey.service.js', async (importOriginal) => {
    const actual = (await importOriginal()) as any;
    return {
        ...actual,
        hashApiKey: vi.fn((rawKey: string) => {
            if (rawKey === 'valid-key') return 'valid-hash';
            return 'invalid-hash';
        }),
    };
});

beforeAll(async () => {
    const keyPair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        privateKeyEncoding: {
            format: 'pem',
            type: 'pkcs8',
        },
        publicKeyEncoding: {
            format: 'pem',
            type: 'spki',
        },
    });

    privateKey = await importPKCS8(keyPair.privateKey, JWT_ALG);
    publicKeyPem = keyPair.publicKey;
    env.JWT_PUBLIC_KEY = publicKeyPem;
});

beforeEach(() => {
    redisMockState.counters.clear();
});

describe('API Key Endpoints and Middleware', () => {
    describe('CRUD Endpoints', () => {
        it('lists API keys for authenticated user', async () => {
            const token = await createToken();
            const response = await request(app)
                .get('/api/keys')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(Array.isArray(response.body.apiKeys)).toBe(true);
            expect(response.body.apiKeys[0].name).toBe('Default Key');
        });

        it('creates a new API key', async () => {
            const token = await createToken();
            const response = await request(app)
                .post('/api/keys')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'New Key',
                    permissions: ['decode'],
                });

            expect(response.status).toBe(201);
            expect(response.body.ok).toBe(true);
            expect(response.body.apiKey.name).toBe('New Key');
            expect(response.body.apiKey.rawKey).toBeDefined();
        });

        it('updates an existing API key', async () => {
            const token = await createToken();
            const response = await request(app)
                .patch('/api/keys/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    name: 'Updated Key',
                    permissions: ['decode'],
                });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.apiKey.name).toBe('Updated Key');
        });

        it('revokes an API key', async () => {
            const token = await createToken();
            const response = await request(app)
                .delete('/api/keys/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.message).toBe('API key revoked successfully');
        });
    });

    describe('API Key Authentication and Rate Limiting Middleware', () => {
        it('authorizes requests with a valid API key', async () => {
            const response = await request(app)
                .post('/api/decode')
                .set('X-API-Key', 'valid-key')
                .send({
                    input: 'SGVsbG8=',
                });

            expect(response.status).toBe(200);
            expect(response.body.finalOutput).toBe('Hello');
            expect(response.headers['x-ratelimit-limit']).toBe('2');
            expect(response.headers['x-ratelimit-remaining']).toBe('1');
        });

        it('returns 401 for requests with an invalid API key', async () => {
            const response = await request(app)
                .post('/api/decode')
                .set('X-API-Key', 'invalid-key')
                .send({
                    input: 'SGVsbG8=',
                });

            expect(response.status).toBe(401);
        });

        it('enforces daily rate limit for API keys using Redis', async () => {
            let response = await request(app)
                .post('/api/decode')
                .set('X-API-Key', 'valid-key')
                .send({ input: 'SGVsbG8=' });
            expect(response.status).toBe(200);
            expect(response.headers['x-ratelimit-remaining']).toBe('1');

            response = await request(app)
                .post('/api/decode')
                .set('X-API-Key', 'valid-key')
                .send({ input: 'SGVsbG8=' });
            expect(response.status).toBe(200);
            expect(response.headers['x-ratelimit-remaining']).toBe('0');

            response = await request(app)
                .post('/api/decode')
                .set('X-API-Key', 'valid-key')
                .send({ input: 'SGVsbG8=' });
            expect(response.status).toBe(429);
            expect(response.body.error).toBe('Too Many Requests');
        });
    });
});
