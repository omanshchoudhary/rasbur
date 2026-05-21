import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { importPKCS8, SignJWT } from 'jose';
import { app } from './app.js';
import { env } from './config/env.js';

const JWT_ALG = 'RS256';
let privateKey: any;
let publicKeyPem: string;

async function createToken(userId = 'test-user-1', email = 'test@example.com', tier = 'free'): Promise<string> {
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
                    oauthProvider: 'google',
                    dailyDecodeCount: 5,
                    lastDecodeReset: new Date(),
                };
            }
            return null;
        }),
    },
}));

vi.mock('./auth/refresh.service.js', () => ({
    rotateRefreshToken: vi.fn(async (token: string) => {
        if (token === 'valid-refresh-token') {
            return {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                accessTokenExpiresAt: new Date(),
                refreshExpiresAt: new Date(),
            };
        }
        throw new Error('Invalid refresh token');
    }),
    logoutUser: vi.fn(async (token: string) => {
        if (token === 'valid-refresh-token') {
            return;
        }
        throw new Error('Invalid refresh token');
    }),
    storeRefreshSession: vi.fn(),
}));

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

describe('Authentication Integration Tests', () => {
    describe('GET /api/me (Protected Route & JWT Verification)', () => {
        it('rejects requests with a missing token', async () => {
            const response = await request(app).get('/api/me');
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Missing token');
        });

        it('rejects requests with an invalid/forged token', async () => {
            const response = await request(app)
                .get('/api/me')
                .set('Authorization', 'Bearer invalid-token-string');
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid token');
        });

        it('allows access and returns profile for a valid token', async () => {
            const token = await createToken('test-user-1', 'test@example.com', 'free');
            const response = await request(app)
                .get('/api/me')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.id).toBe('test-user-1');
            expect(response.body.user.name).toBe('Test User');
            expect(response.body.user.email).toBe('test@example.com');
            expect(response.body.user.avatar).toBe('avatar-url');
            expect(response.body.user.tier).toBe('free');
            expect(response.body.user.oauthProvider).toBe('google');
            expect(response.body.user.dailyDecodeCount).toBe(5);
            expect(response.body.user.lastDecodeReset).toBeDefined();
        });
    });

    describe('POST /auth/refresh (Token Rotation)', () => {
        it('rejects requests with a missing refresh token', async () => {
            const response = await request(app).post('/auth/refresh').send({});
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Missing refresh token');
        });

        it('rejects requests with an invalid refresh token', async () => {
            const response = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken: 'invalid-refresh-token' });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid refresh token');
        });

        it('returns new tokens for a valid refresh token', async () => {
            const response = await request(app)
                .post('/auth/refresh')
                .send({ refreshToken: 'valid-refresh-token' });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
            expect(response.body.accessToken).toBe('new-access-token');
            expect(response.body.refreshToken).toBe('new-refresh-token');
            expect(response.body.accessTokenExpiresAt).toBeDefined();
            expect(response.body.refreshExpiresAt).toBeDefined();
        });
    });

    describe('POST /auth/logout (Session Invalidation)', () => {
        it('rejects requests with a missing refresh token', async () => {
            const response = await request(app).post('/auth/logout').send({});
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Missing refresh token');
        });

        it('rejects requests with an invalid refresh token', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .send({ refreshToken: 'invalid-refresh-token' });
            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Invalid refresh token');
        });

        it('returns 200 for a successful logout with a valid refresh token', async () => {
            const response = await request(app)
                .post('/auth/logout')
                .send({ refreshToken: 'valid-refresh-token' });

            expect(response.status).toBe(200);
            expect(response.body.ok).toBe(true);
        });
    });
});
