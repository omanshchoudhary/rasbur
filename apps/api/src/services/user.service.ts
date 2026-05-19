import { User } from '../models/user.js';

export async function getUserProfileById(userId: string) {
    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        tier: user.tier,
        oauthProvider: user.oauthProvider,
    };
}
