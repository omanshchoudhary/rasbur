import { importPKCS8, SignJWT } from 'jose';
import { env } from '../config/env.js';

const JWT_ALG = 'RS256';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';

type TokenUser = {
    id: string;
    email: string;
    tier: string;
};

// Signing tokens
async function signToken(user: TokenUser, expiresIn: string, tokenType: 'access' | 'refresh') {
    const privateKey = await importPKCS8(env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'), JWT_ALG);

    return new SignJWT({
        email: user.email,
        tier: user.tier,
        tokenType,
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
        signToken(user, ACCESS_TOKEN_TTL, 'access'),
        signToken(user, REFRESH_TOKEN_TTL, 'refresh'),
    ]);

    return {
        accessToken,
        refreshToken,
    };
}
