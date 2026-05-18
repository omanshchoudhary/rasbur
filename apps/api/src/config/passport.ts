import passport from 'passport';
import {
    Strategy as GoogleStrategy,
    type GoogleCallbackParameters,
    type Profile as GoogleProfile,
    type VerifyCallback as GoogleVerifyCallback,
} from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, type Profile as GitHubProfile } from 'passport-github2';
import { env } from './env.js';
import { handleGithubOAuth, handleGoogleOAuth } from '../auth/oauth.service.js';

export const configureGoogleStrategy = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
                callbackURL: env.GOOGLE_CALLBACK_URL,
                passReqToCallback: true,
            },
            async (
                _request: unknown,
                _accessToken: string,
                _refreshToken: string,
                _params: GoogleCallbackParameters,
                profile: GoogleProfile,
                done: GoogleVerifyCallback
            ) => {
                const user = await handleGoogleOAuth(profile);
                return done(null, user);
            }
        )
    );
};

export const configureGitHubStrategy = () => {
    passport.use(
        new GitHubStrategy(
            {
                clientID: env.GITHUB_CLIENT_ID,
                clientSecret: env.GITHUB_CLIENT_SECRET,
                callbackURL: env.GITHUB_CALLBACK_URL,
            },
            async (
                _accessToken: string,
                _refreshToken: string,
                profile: GitHubProfile,
                done: (error: unknown, user?: unknown) => void
            ) => {
                const user = await handleGithubOAuth(profile);
                return done(null, user);
            }
        )
    );
};
