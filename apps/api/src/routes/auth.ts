import { Router, type Request, type Response } from 'express';
import passport from 'passport';
import { issueAuthTokens } from '../auth/tokens.js';
import { logoutUser, rotateRefreshToken, storeRefreshSession } from '../auth/refresh.service.js';

export const authRouter = Router();

authRouter.use(passport.initialize());

authRouter.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    })
);

authRouter.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/login',
        failureMessage: false,
    }),
    async (req: Request, res: Response) => {
        const user = req.user as
            | {
                id: string;
                name: string;
                email: string;
                tier: string;
                avatar?: string | null;
            }
            | undefined;

        if (!user) {
            res.status(500).json({
                ok: false,
                error: 'OAuth user was not resolved',
            });
            return;
        }

        const tokens = await issueAuthTokens({
            id: user.id,
            email: user.email,
            tier: user.tier,
        });
        await storeRefreshSession(user.id, tokens.refreshJti, tokens.refreshExpiresAt);

        res.status(200).json({
            ok: true,
            provider: 'google',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                tier: user.tier,
                avatar: user.avatar,
            },
            ...tokens,
        });
    }
);

authRouter.get(
    '/github',
    passport.authenticate('github', {
        scope: ['user:email'],
        session: false,
    })
);

authRouter.get(
    '/github/callback',
    passport.authenticate('github', {
        failureRedirect: '/login',
        failureMessage: false,
    }),
    async (req: Request, res: Response) => {
        const user = req.user as
            | {
                id: string;
                name: string;
                email: string;
                tier: string;
                avatar?: string | null;
            }
            | undefined;

        if (!user) {
            res.status(500).json({
                ok: false,
                error: 'OAuth user was not resolved',
            });
            return;
        }

        const tokens = await issueAuthTokens({
            id: user.id,
            email: user.email,
            tier: user.tier,
        });
        await storeRefreshSession(user.id, tokens.refreshJti, tokens.refreshExpiresAt);

        res.status(200).json({
            ok: true,
            provider: 'github',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                tier: user.tier,
                avatar: user.avatar,
            },
            ...tokens,
        });
    }
);

authRouter.post('/refresh', async (req: Request, res: Response) => {
    
    const refreshToken = req.body?.refreshToken;
    if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
        return res.status(401).json({ ok: false, error: 'Missing refresh token' });
    }

    try {
        const tokens = await rotateRefreshToken(refreshToken);

        return res.status(200).json({
            ok: true,
            ...tokens,
        });
    } catch {
        return res.status(401).json({
            ok: false,
            error: 'Invalid refresh token',
        });
    }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
    const refreshToken = req.body?.refreshToken;

    if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
        return res.status(401).json({ ok: false, error: 'Missing refresh token' });
    }
    try {
        await logoutUser(refreshToken);
        return res.status(200).json({ ok: true });
    } catch {
        return res.status(401).json({ ok: false, error: 'Invalid refresh token' });
    }
});
