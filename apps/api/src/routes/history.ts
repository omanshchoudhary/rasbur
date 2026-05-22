import { Router } from 'express';
import { saveHistoryEntry } from '../controllers/history.controller.js';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { saveHistorySchema } from '@rasbur/shared';

export const historyRouter = Router();

historyRouter.post('/history', jwtAuthMiddleware, validate({ body: saveHistorySchema }), saveHistoryEntry);