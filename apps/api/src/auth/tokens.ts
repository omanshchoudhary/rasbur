import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { importPKCS8, SignJWT } from 'jose';

const JWT_ALG = 'RS256';
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// Resolve path to the root private.pem file
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const privateKeyPath = join(__dirname, '../../../private.pem');

// Read and import the private key
const privateKeyContent = readFileSync(privateKeyPath, 'utf8');
const privateKey = await importPKCS8(privateKeyContent, JWT_ALG);

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

async function signRefreshToken(user: TokenUser, expiresIn: string, refreshTokenId: string) {
    return new SignJWT({
        email: user.email,
        tier: user.tier,
        tokenType: 'refresh',
    })
        .setJti(refreshTokenId)
        .setProtectedHeader({ alg: JWT_ALG })
        .setSubject(user.id)
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(privateKey);
}

// Returning access and refresh tokens
export async function issueAuthTokens(user: TokenUser) {
    const refreshJti = randomUUID();
    const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    const [accessToken, refreshToken] = await Promise.all([
        signAccessToken(user, ACCESS_TOKEN_TTL),
        signRefreshToken(user, REFRESH_TOKEN_TTL, refreshJti),
    ]);

    return {
        accessToken,
        refreshToken,
        refreshJti,
        refreshExpiresAt,
    };
}
