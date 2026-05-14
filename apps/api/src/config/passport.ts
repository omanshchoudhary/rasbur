import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
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
