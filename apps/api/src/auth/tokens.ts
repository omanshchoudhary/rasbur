import { randomUUID } from 'crypto';
import { importPKCS8, SignJWT } from 'jose';
import { env } from '../config/env.js';

const JWT_ALG = 'RS256';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'), JWT_ALG);

type TokenUser = {
    id: string;
    email: string;
    tier: string;
};

// Signing tokens
async function signAccessToken(user: TokenUser, expiresIn: string) {

    return new SignJWT({
        email: user.email,
        tier: user.tier,
        tokenType: 'access',
    })
        .setProtectedHeader({ alg: JWT_ALG })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(privateKey);
}

async function signRefreshToken(user: TokenUser, expiresIn: string) {
    const refreshTokenId = randomUUID();
    return new SignJWT({
        email: user.email,
        tier: user.tier,
        tokenType: 'refresh',
        jti: refreshTokenId,
    })
        .setProtectedHeader({ alg: JWT_ALG })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(privateKey);
}

// Returning access and refresh tokens
export async function issueAuthTokens(user: TokenUser) {
    const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(user, ACCESS_TOKEN_TTL),
        signRefreshToken(user, REFRESH_TOKEN_TTL),
    ]);

    return {
        accessToken,
        refreshToken,
    };
}
