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
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;
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
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
            query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);
            query.createdAt.$lte = end;
        }
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

export async function getHistoryById(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    const id = req.params.id;
    try {
        const historyEntry = await DecodeHistory.findOne({ _id: id, userId });

        if (!historyEntry) {
            return res.status(404).json({ error: 'History entry not found' });
        }
        return res.status(200).json({
            ok: true,
            history: historyEntry
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

export async function deleteHistoryEntry(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }

    const id = req.params.id;

    try {
        const deletedEntry = await DecodeHistory.findOneAndDelete({ _id: id, userId });
        if (!deletedEntry) {
            return res.status(404).json({ error: 'History entry not found' });
        }
        return res.status(200).json({
            ok: true,
            message: 'History entry deleted successfully'
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}

export async function clearHistory(req: Request, res: Response) {
    const authUser = req.user as { id?: string } | undefined;
    const userId = authUser?.id;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: User ID not found' });
    }
    try {
        const query: any = { userId }
        const search = req.query.search as string | undefined;
        const encodingType = req.query.encodingType as string | undefined;
        const startDate = req.query.startDate as string | undefined;
        const endDate = req.query.endDate as string | undefined;
        if (search) {
            query.$or = [
                { originalInput: { $regex: search, $options: 'i' } },
                { finalOutput: { $regex: search, $options: 'i' } }
            ];
        }
        if (encodingType) {
            query['steps.decoderName'] = encodingType;
        }
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setUTCHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }
        const result = await DecodeHistory.deleteMany(query);
        return res.status(200).json({
            ok: true,
            deletedCount: result.deletedCount
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }

}
