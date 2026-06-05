import { Router } from 'express';
import {
    saveHistoryEntry,
    getHistory,
    getHistoryById,
    deleteHistoryEntry,
    clearHistory,
} from '../controllers/history.controller.js';
import { authenticate, requirePermission } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { saveHistorySchema } from '@rasbur/shared';

export const historyRouter = Router();

historyRouter.post(
    '/history',
    authenticate,
    requirePermission('history'),
    validate({ body: saveHistorySchema }),
    saveHistoryEntry
);

historyRouter.get('/history', authenticate, requirePermission('history'), getHistory);

historyRouter.get('/history/:id', authenticate, requirePermission('history'), getHistoryById);

historyRouter.delete('/history', authenticate, requirePermission('history'), clearHistory);
historyRouter.delete(
    '/history/:id',
    authenticate,
    requirePermission('history'),
    deleteHistoryEntry
);
