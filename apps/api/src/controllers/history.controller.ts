import type { Request, Response } from 'express'
import { DecodeHistory } from '../models/history.js'

export async function saveHistoryEntry(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }
    try {
        const { originalInput, steps, finalOutput } = req.body;
        const historyEntry = new DecodeHistory({
            userId,
            originalInput,
            steps,
            finalOutput
        });
        await historyEntry.save();

        return res.status(201).json({
            ok: true,
            history: historyEntry
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }

}   