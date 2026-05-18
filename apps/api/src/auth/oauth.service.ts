import { User } from '../models/user.js';

type OAuthProvider = 'google' | 'github';

type OAuthProfile = {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    photos?: Array<{ value: string }>;
};

// User Verification and Creation From DB
async function resolveOAuthUser(provider: OAuthProvider, profile: OAuthProfile) {
    const email = profile.emails?.[0]?.value?.toLowerCase();
    const avatar = profile.photos?.[0]?.value;

    // Check with provider and provider id
    let user = await User.findOne({
        oauthProvider: provider,
        oauthId: profile.id,
    });

    // Check with email
    if (!user && email) {
        user = await User.findOne({
            email,
        });
    }

    // Create a user 
    if (!user) {
        user = await User.create({
            name: profile.displayName?.trim() || email || 'Unknown user',
            email: email || `${provider}-${profile.id}@rasbur.local`,
            avatar,
            oauthProvider: provider,
            oauthId: profile.id,
            tier: 'free',
        });
    }

    return user;
}

export async function handleGoogleOAuth(profile: OAuthProfile) {
    return resolveOAuthUser('google', profile);
}

export async function handleGithubOAuth(profile: OAuthProfile) {
    return resolveOAuthUser('github', profile);
}
