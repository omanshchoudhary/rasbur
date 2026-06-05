import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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

vi.mock('./cache/redis.js', () => ({
    redis: {
        expire: vi.fn(async () => 1),
        get: vi.fn(async () => 'ok'),
        incr: vi.fn(async () => 1),
        incrby: vi.fn(async () => 1),
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
                };
            }
            return null;
        }),
    },
}));

const mockFindChain = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockImplementation(async () => [
        {
            _id: 'test-history-1',
            userId: 'test-user-1',
            originalInput: 'SGVsbG8=',
            steps: [
                {
                    decoderName: 'base64',
                    confidence: 1,
                    input: 'SGVsbG8=',
                    output: 'Hello',
                    explanation: 'Decoded Base64',
                },
            ],
            finalOutput: 'Hello',
            createdAt: new Date(),
        },
    ]),
};

vi.mock('./models/history.js', () => {
    const mockSave = vi.fn().mockImplementation(async function (this: any) {
        this._id = 'test-history-new';
        return this;
    });
    return {
        DecodeHistory: Object.assign(
            vi.fn().mockImplementation(function (data: any) {
                return {
                    ...data,
                    save: mockSave,
                };
            }),
            {
                findOne: vi.fn(async (query: any) => {
                    if (query._id === 'test-history-1' && query.userId === 'test-user-1') {
                        return {
                            _id: 'test-history-1',
                            userId: 'test-user-1',
                            originalInput: 'SGVsbG8=',
                            steps: [
                                {
                                    decoderName: 'base64',
                                    confidence: 1,
                                    input: 'SGVsbG8=',
                                    output: 'Hello',
                                    explanation: 'Decoded Base64',
                                },
                            ],
                            finalOutput: 'Hello',
                            createdAt: new Date(),
                        };
                    }
                    return null;
                }),
                findOneAndDelete: vi.fn(async (query: any) => {
                    if (query._id === 'test-history-1' && query.userId === 'test-user-1') {
                        return {
                            _id: 'test-history-1',
                            userId: 'test-user-1',
                            originalInput: 'SGVsbG8=',
                            steps: [
                                {
                                    decoderName: 'base64',
                                    confidence: 1,
                                    input: 'SGVsbG8=',
                                    output: 'Hello',
                                    explanation: 'Decoded Base64',
                                },
                            ],
                            finalOutput: 'Hello',
                            createdAt: new Date(),
                        };
                    }
                    return null;
                }),
                countDocuments: vi.fn(async () => 1),
                find: vi.fn(() => mockFindChain),
                deleteMany: vi.fn(async () => ({ deletedCount: 1 })),
            }
        ),
    };
});

const mockFindOneShareChain = {
    populate: vi.fn().mockImplementation(async () => {
        return {
            slug: 'test-slug-1',
            historyId: {
                _id: 'test-history-1',
                userId: 'test-user-1',
                originalInput: 'SGVsbG8=',
                steps: [
                    {
                        decoderName: 'base64',
                        confidence: 1,
                        input: 'SGVsbG8=',
                        output: 'Hello',
                        explanation: 'Decoded Base64',
                    },
                ],
                finalOutput: 'Hello',
                createdAt: new Date(),
            },
            userId: 'test-user-1',
            expiresAt: new Date(Date.now() + 86400 * 1000 * 30),
            viewCount: 0,
            save: vi.fn(async () => {}),
        };
    }),
};

vi.mock('./models/share.js', () => {
    const mockSave = vi.fn().mockImplementation(async function (this: any) {
        this._id = 'test-share-new';
        return this;
    });
    return {
        Share: Object.assign(
            vi.fn().mockImplementation(function (data: any) {
                return {
                    ...data,
                    save: mockSave,
                };
            }),
            {
                findOne: vi.fn(() => mockFindOneShareChain),
            }
        ),
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

describe('History, Sharing & Comparison Integration Tests', () => {
    describe('Decode History Endpoints', () => {
        it('saves a history entry for authenticated user', async () => {
            const token = await createToken();
            const response = await request(app)
                .post('/api/history')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    originalInput: 'SGVsbG8=',
                    steps: [
                        {
                            decoderName: 'base64',
                            confidence: 1,
                            input: 'SGVsbG8=',
                            output: 'Hello',
                            explanation: 'Decoded Base64',
                        },
                    ],
                    finalOutput: 'Hello',
                });

            expect(response.status).toBe(201);
            expect(response.body.ok).toBe(true);
            expect(response.body.history).toBeDefined();
            expect(response.body.history.originalInput).toBe('SGVsbG8=');
        });

        it('returns 401 for unauthorized history save request', async () => {
            const response = await request(app).post('/api/history').send({
                originalInput: 'SGVsbG8=',
                steps: [],
                finalOutput: 'Hello',
            });

            expect(response.status).toBe(401);
        });

        it('gets a paginated history list', async () => {
            const token = await createToken();
            const response = await request(app)
                .get('/api/history')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(Array.isArray(response.body.entries)).toBe(true);
            expect(response.body.entries).toHaveLength(1);
        });

        it('gets a single history entry by ID', async () => {
            const token = await createToken();
            const response = await request(app)
                .get('/api/history/test-history-1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.history._id).toBe('test-history-1');
        });

        it('deletes a single history entry by ID', async () => {
            const token = await createToken();
            const response = await request(app)
                .delete('/api/history/test-history-1')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
        });

        it('performs bulk clear on history', async () => {
            const token = await createToken();
            const response = await request(app)
                .delete('/api/history')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
        });
    });

    describe('Sharing Endpoints', () => {
        it('creates a share link for an existing own history entry', async () => {
            const token = await createToken();
            const response = await request(app)
                .post('/api/share')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    historyId: 'test-history-1',
                    expiresInDays: 30,
                });

            expect(response.status).toBe(201);
            expect(response.body.ok).toBe(true);
            expect(response.body.share.slug).toBeDefined();
        });

        it('returns 404 when sharing a non-existent entry', async () => {
            const token = await createToken();
            const response = await request(app)
                .post('/api/share')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    historyId: 'does-not-exist',
                });

            expect(response.status).toBe(404);
        });

        it('retrieves shared result publicly by slug', async () => {
            const response = await request(app).get('/api/share/test-slug-1');

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.share.slug).toBe('test-slug-1');
            expect(response.body.share.historyId).toBeDefined();
        });
    });

    describe('Comparison Endpoints', () => {
        it('compares two inputs and returns diff', async () => {
            const token = await createToken();
            const response = await request(app)
                .post('/api/compare')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    inputA: 'SGVsbG8=',
                    inputB: 'R29vZGJ5ZQ==',
                });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.resultA).toBeDefined();
            expect(response.body.resultB).toBeDefined();
            expect(Array.isArray(response.body.diff)).toBe(true);
        });

        it('returns validation error for invalid comparison inputs', async () => {
            const token = await createToken();
            const response = await request(app)
                .post('/api/compare')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    inputA: '',
                    inputB: '',
                });

            expect(response.status).toBe(400);
        });
    });
});
