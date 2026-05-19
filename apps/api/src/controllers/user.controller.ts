import type { Request, Response } from 'express';
import { getUserProfileById } from '../services/user.service.js';

export async function getCurrentUser(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }
    const user = await getUserProfileById(userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
        ok: true,
        user,
    });
}
