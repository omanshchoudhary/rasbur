import { importSPKI, jwtVerify } from 'jose';
import type { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env.js';
import type { SocketUser } from './types.js';

const JWT_ALG = 'RS256';

const publicKeyPromise = importSPKI(env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), JWT_ALG);

function extractToken(socket: Socket): string | null {
    // Primary Check
    const authToken = socket.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.trim().length > 0) {
        return authToken.trim();
    }

    // Fallback Check
    const authHeader = socket.handshake.headers.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        return authHeader.slice('Bearer '.length).trim();
    }

    return null;
}

// Returns null for tokenless (anonymous) connections. A token that is present but
// invalid still throws, so it is rejected rather than silently downgraded.
export async function verifySocketUser(socket: Socket): Promise<SocketUser | null> {
    const token = extractToken(socket);
    if (!token) {
        return null;
    }

    const publicKey = await publicKeyPromise;
    const { payload } = await jwtVerify(token, publicKey, {
        algorithms: [JWT_ALG],
    });

    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
        throw new Error('Invalid token subject');
    }

    return {
        id: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        tier: typeof payload.tier === 'string' ? payload.tier : undefined,
    };
}

export function attachSocketAuth(io: SocketIOServer): void {
    io.use(async (socket, next) => {
        try {
            const user = await verifySocketUser(socket);
            if (user) {
                socket.data.user = user;
            } else {
                // Anonymous connection: identify by IP so rate limiting and room
                // scoping still apply. Real user ids are Mongo ObjectIds, so the
                // `anon:` prefix can never collide with a signed-in user.
                const ip = socket.handshake.address || 'unknown';
                socket.data.user = { id: `anon:${ip}`, tier: 'anon' };
            }
            next();
        } catch (error) {
            next(new Error('Unauthorized websocket connection'));
        }
    });
}
