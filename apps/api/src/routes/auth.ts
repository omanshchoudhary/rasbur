import { Router, type Request, type Response } from 'express';
import passport from 'passport';

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
    (_req: Request, res: Response) => {
        res.status(200).json({
            ok: true,
            provider: 'google',
            message: 'Google authentication successful',
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
    (_req: Request, res: Response) => {
        res.status(200).json({
            ok: true,
            provider: 'github',
            message: 'GitHub authentication successful',
        });
    }
);
