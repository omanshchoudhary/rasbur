import type { Request, Response } from 'express'
import crypto from 'crypto';
import { Share } from '../models/share.js';
import { DecodeHistory } from '../models/history.js';

export async function createShareLink(req:Request, res: Response) {
    const authUser = req.user as {id?: string} | undefined;
    const userId = authUser?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    try {
        let {historyId, expiresInDays } = req.body;

        
        const historyEntry= await DecodeHistory.findOne({_id: historyId, userId})
        if (!historyEntry) {
            return res.status(404).json({ error: 'History entry not found' });
        }
        const days = expiresInDays || 30;
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + days);

        // Generating 8 char url slug
        const slug = crypto.randomBytes(4).toString('hex');
        const shareEntry = new Share({
            slug,
            historyId,
            userId,
            expiresAt
        });

        await shareEntry.save();

        res.status(201).json({ ok: true, share: shareEntry})
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

export async function getShare(req: Request, res: Response) {
    const slug = req.params.slug;

    try {
        const shareEntry = await Share.findOne({ slug }).populate('historyId');

        if (!shareEntry) {
            return res.status(404).json({ error: 'Shared link not found' });
        }

        if (shareEntry.expiresAt < new Date()) {
            return res.status(410).json({ error: 'Share link has expired' });
        }

        shareEntry.viewCount += 1;
        await shareEntry.save();

        return res.status(200).json({ ok: true, share: shareEntry });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}