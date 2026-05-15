import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { env } from './env.js';

export const configureGoogleStrategy = () => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: env.GOOGLE_CLIENT_ID,
                clientSecret: env.GOOGLE_CLIENT_SECRET,
                callbackURL: env.GOOGLE_CALLBACK_URL,
                passReqToCallback: true,
            },
            async (request, accessToken, refreshToken, profile, done) => {
                return done(null, profile);
            }
        )
    );
};

export const configureGitHubStrategy = () => {
    passport.use(
        new GitHubStrategy(
            {
                clientID: env.GITHUB_CLIENT_ID!,
                clientSecret: env.GITHUB_CLIENT_SECRET!,
                callbackURL: env.GITHUB_CALLBACK_URL!,
            },
            (accessToken: string, refreshToken: string, profile: any, done: any) => {
                return done(null, profile);
            }
        )
    );
};
