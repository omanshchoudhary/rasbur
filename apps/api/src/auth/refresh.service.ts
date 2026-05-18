import { redis } from '../cache/redis.js';
import { importSPKI, jwtVerify } from 'jose';
import { issueAuthTokens } from './tokens.js';
import { env } from '../config/env.js';

const JWT_ALG = 'RS256';
const publicKey = await importSPKI(env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), JWT_ALG);

type RefreshPayload = {
    sub: string;
    jti?: string;
    email?: string;
    tier?: string;
};
export async function storeRefreshSession(userId: string, jti: string, expiresAt: Date) {
    const ttlSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    await redis.set(`refresh-session:${userId}`, jti, { ex: ttlSeconds });
}

export async function verifyRefreshSession(userId: string, jti: string) {
    const storedJti = await redis.get(`refresh-session:${userId}`);
    if (typeof storedJti !== 'string') {
        return false;
    }
    return jti === storedJti;
}

export async function rotateRefreshToken(refreshToken: string) {
    const { payload } = await jwtVerify(refreshToken, publicKey, {
        algorithms: [JWT_ALG],
    });

    const typed = payload as unknown as RefreshPayload;
    if (!typed.sub || !typed.jti) {
        throw new Error('Invalid refresh token');
    }

    const isValidSession = await verifyRefreshSession(typed.sub, typed.jti);
    if (!isValidSession) {
        throw new Error('Refresh token session mismatch');
    }

    const user = {
        id: typed.sub,
        email: typed.email ?? '',
        tier: typed.tier ?? 'free',
    };

    // Generating new tokens
    const tokens = await issueAuthTokens(user);
    await storeRefreshSession(typed.sub, tokens.refreshJti, tokens.refreshExpiresAt);

    return tokens;
}

export async function logoutUser(refreshToken: string) {
    const { payload } = await jwtVerify(refreshToken, publicKey, {
        algorithms: [JWT_ALG],
    });

    const typed = payload as unknown as RefreshPayload;
    if (!typed.sub || !typed.jti) {
        throw new Error('Invalid refresh token');
    }

    const key = `refresh-session:${typed.sub}`;
    await redis.del(key);

}
