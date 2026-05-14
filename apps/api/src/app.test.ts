import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from './app.js';

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
        set: vi.fn(async () => 'OK'),
    },
}));

describe('API app', () => {
    beforeEach(() => {
        redisMockState.counters.clear();
    });

    it('returns health status from GET /health', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
        expect(response.body.environment).toBe('test');
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('requestId');
        expect(response.headers).toHaveProperty('x-request-id');
    });
    it('returns the list of available decoders from GET /api/decoders', async () => {
        const response = await request(app).get('/api/decoders');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);

        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('description');

        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
        expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });
    it('decodes a valid input with POST /api/decode', async () => {
        const response = await request(app).post('/api/decode').send({
            input: 'SGVsbG8=',
        });

        expect(response.status).toBe(200);
        expect(response.body.originalInput).toBe('SGVsbG8=');
        expect(response.body.finalOutput).toBe('Hello');
        expect(Array.isArray(response.body.steps)).toBe(true);
        expect(response.body.steps.length).toBeGreaterThan(0);

        expect(response.body.steps[0]).toHaveProperty('decoderName');
        expect(response.body.steps[0]).toHaveProperty('confidence');
        expect(response.body.steps[0]).toHaveProperty('input');
        expect(response.body.steps[0]).toHaveProperty('output');
        expect(response.body.steps[0]).toHaveProperty('explanation');
    });
    it('returns validation error for invalid POST /api/decode body', async () => {
        const response = await request(app).post('/api/decode').send({});

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Validation error');
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body).toHaveProperty('requestId');
        expect(response.headers).toHaveProperty('x-request-id');
    });

    it('identifies likely encoding formats with POST /api/identify', async () => {
        const response = await request(app).post('/api/identify').send({
            input: 'SGVsbG8=',
        });

        expect(response.status).toBe(200);
        expect(response.body.input).toBe('SGVsbG8=');
        expect(Array.isArray(response.body.matches)).toBe(true);
        expect(response.body.matches.length).toBeGreaterThan(0);

        expect(response.body.matches[0]).toHaveProperty('name');
        expect(response.body.matches[0]).toHaveProperty('confidence');
        expect(response.body.matches[0]).toHaveProperty('description');
    });

    it('batch decodes multiple inputs with POST /api/decode/batch', async () => {
        const response = await request(app)
            .post('/api/decode/batch')
            .send({
                inputs: ['SGVsbG8=', '48656c6c6f'],
            });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(response.body.items).toHaveLength(2);

        expect(response.body.items[0].input).toBe('SGVsbG8=');
        expect(response.body.items[0].result.finalOutput).toBe('Hello');

        expect(response.body.items[1].input).toBe('48656c6c6f');
        expect(response.body.items[1].result.finalOutput).toBe('Hello');
    });

    it('returns validation error for empty batch decode request', async () => {
        const response = await request(app).post('/api/decode/batch').send({
            inputs: [],
        });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe('error');
        expect(response.body.message).toBe('Validation error');
        expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('returns 404 for unknown routes', async () => {
        const response = await request(app).get('/does-not-exist');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Route not found');
    });

    it('applies rate limit headers on API routes', async () => {
        const response = await request(app).get('/api/decoders');

        expect(response.status).toBe(200);
        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
        expect(response.headers).toHaveProperty('x-ratelimit-reset');
    });

    it('does not apply rate limit headers on /health', async () => {
        const response = await request(app).get('/health');

        expect(response.status).toBe(200);
        expect(response.headers['x-ratelimit-limit']).toBeUndefined();
        expect(response.headers['x-ratelimit-remaining']).toBeUndefined();
        expect(response.headers['x-ratelimit-reset']).toBeUndefined();
    });
});
