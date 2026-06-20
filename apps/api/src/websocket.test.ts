import { createServer, type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { generateKeyPairSync } from 'node:crypto';
import { importPKCS8, SignJWT } from 'jose';
import { io, type Socket } from 'socket.io-client';
import type { Server as SocketIOServer } from 'socket.io';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

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

const JWT_ALG = 'RS256';

type RoomAckResponse = {
    ok: boolean;
    room?: string;
    error?: string;
};

type LiveDecodeResponse =
    | {
          ok: true;
          result: {
              originalInput: string;
              finalOutput: string;
              steps: unknown[];
          };
      }
    | {
          ok: false;
          error: string;
          issues?: unknown[];
      };

let httpServer: HttpServer;
let socketServer: SocketIOServer;
let baseUrl: string;
let privateKey: CryptoKey;
let testPrivateKeyPem: string;
const activeSockets = new Set<Socket>();

async function createToken(userId = 'test-user-1'): Promise<string> {
    return new SignJWT({
        email: 'test@example.com',
        tier: 'free',
    })
        .setProtectedHeader({ alg: JWT_ALG })
        .setSubject(userId)
        .setIssuedAt()
        .setExpirationTime('15m')
        .sign(privateKey);
}

function connectSocket(token?: string): Socket {
    const socket = io(baseUrl, {
        auth: token ? { token } : undefined,
        forceNew: true,
        reconnection: false,
        transports: ['websocket'],
    });

    activeSockets.add(socket);
    socket.once('disconnect', () => {
        activeSockets.delete(socket);
    });

    return socket;
}

function waitForConnect(socket: Socket): Promise<void> {
    return new Promise((resolve, reject) => {
        socket.once('connect', () => resolve());
        socket.once('connect_error', reject);
    });
}

function waitForConnectError(socket: Socket): Promise<Error> {
    return new Promise((resolve) => {
        socket.once('connect_error', (error) => resolve(error));
    });
}

function emitWithAck<T>(socket: Socket, event: string, ...args: unknown[]): Promise<T> {
    return new Promise((resolve) => {
        socket.emit(event, ...args, (response: T) => {
            resolve(response);
        });
    });
}

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

    testPrivateKeyPem = keyPair.privateKey;
    privateKey = await importPKCS8(testPrivateKeyPem, JWT_ALG);
    process.env.JWT_PUBLIC_KEY = keyPair.publicKey;

    const [{ app }, { createSocketServer }] = await Promise.all([
        import('./app.js'),
        import('./websocket/server.js'),
    ]);

    httpServer = createServer(app);
    socketServer = createSocketServer(httpServer);

    await new Promise<void>((resolve) => {
        httpServer.listen(0, () => resolve());
    });

    const address = httpServer.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
});

afterEach(() => {
    redisMockState.counters.clear();

    for (const socket of activeSockets) {
        socket.disconnect();
    }

    activeSockets.clear();
});

afterAll(async () => {
    if (!httpServer) {
        return;
    }

    socketServer?.close();

    await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
});

describe('WebSocket handlers', () => {
    it('accepts anonymous socket connections without a token', async () => {
        const socket = connectSocket();

        await waitForConnect(socket);

        expect(socket.connected).toBe(true);

        socket.disconnect();
    });

    it('rejects socket connections with an invalid token', async () => {
        const socket = connectSocket('not-a-real-token');

        const error = await waitForConnectError(socket);

        expect(error.message).toBe('Unauthorized websocket connection');

        socket.disconnect();
    });

    it('accepts socket connections with a valid token', async () => {
        const token = await createToken();
        const socket = connectSocket(token);

        await waitForConnect(socket);

        expect(socket.connected).toBe(true);

        socket.disconnect();
    });

    it('returns live decode result for valid input', async () => {
        const token = await createToken();
        const socket = connectSocket(token);

        await waitForConnect(socket);

        const response = await emitWithAck<LiveDecodeResponse>(socket, 'decode:live', {
            input: 'SGVsbG8=',
        });

        expect(response.ok).toBe(true);
        if (!response.ok) {
            throw new Error(response.error);
        }
        expect(response.result.finalOutput).toBe('Hello');

        socket.disconnect();
    });

    it('returns validation error for invalid live decode payload', async () => {
        const token = await createToken();
        const socket = connectSocket(token);

        await waitForConnect(socket);

        const response = await emitWithAck<LiveDecodeResponse>(socket, 'decode:live', {});

        expect(response.ok).toBe(false);
        if (response.ok) {
            throw new Error('Expected live decode validation error');
        }
        expect(response.error).toBe('Validation error');
        expect(Array.isArray(response.issues)).toBe(true);

        socket.disconnect();
    });

    it('allows joining own user room', async () => {
        const token = await createToken('test-user-1');
        const socket = connectSocket(token);

        await waitForConnect(socket);

        const response = await emitWithAck<RoomAckResponse>(
            socket,
            'room:join',
            'user:test-user-1'
        );

        expect(response).toEqual({
            ok: true,
            room: 'user:test-user-1',
        });

        socket.disconnect();
    });

    it('rejects joining another user room', async () => {
        const token = await createToken('test-user-1');
        const socket = connectSocket(token);

        await waitForConnect(socket);

        const response = await emitWithAck<RoomAckResponse>(socket, 'room:join', 'user:other-user');

        expect(response).toEqual({
            ok: false,
            error: 'Room access denied',
        });

        socket.disconnect();
    });
});
