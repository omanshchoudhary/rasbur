import { Router } from 'express';
import { saveHistoryEntry, getHistory, getHistoryById, deleteHistoryEntry, clearHistory } from '../controllers/history.controller.js';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { saveHistorySchema } from '@rasbur/shared';

export const historyRouter = Router();

historyRouter.post('/history', jwtAuthMiddleware, validate({ body: saveHistorySchema }), saveHistoryEntry);

historyRouter.get('/history', jwtAuthMiddleware, getHistory);

historyRouter.get('/history/:id', jwtAuthMiddleware, getHistoryById);

historyRouter.delete('/history', jwtAuthMiddleware, clearHistory);
historyRouter.delete('/history/:id', jwtAuthMiddleware, deleteHistoryEntry);