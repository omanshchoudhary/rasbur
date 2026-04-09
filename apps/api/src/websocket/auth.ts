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

export async function verifySocketUser(socket: Socket): Promise<SocketUser> {
    const token = extractToken(socket);
    if (!token) {
        throw new Error('Missing auth token');
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
            socket.data.user = user;
            next();
        } catch (error) {
            next(new Error('Unauthorized websocket connection'));
        }
    });
}
