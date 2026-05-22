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

export async function getHistory(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const encodingType = req.query.encodingType as string | undefined;
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }
    const query: any = { userId };
    if (search) {
        query.$or = [
            { originalInput: { $regex: search, $options: 'i' } },
            { finalOutput: { $regex: search, $options: 'i' } }
        ];
    }
    if (encodingType) {
        query['steps.decoderName'] = encodingType;
    }
    const [total, entries] = await Promise.all([
        DecodeHistory.countDocuments(query),
        DecodeHistory.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
    ]);
    return res.status(200).json({
        ok: true,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        entries
    });
}