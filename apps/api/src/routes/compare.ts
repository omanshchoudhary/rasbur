import { Router } from 'express';
import { compareInputs } from '../controllers/compare.controller.js';
import { usageLimitMiddleware } from '../middleware/usageLimit.js';
import { validate } from '../middleware/validate.js';
import { compareRequestSchema } from '@rasbur/shared';

export const compareRouter = Router();

compareRouter.post('/compare', usageLimitMiddleware, validate({ body: compareRequestSchema }), compareInputs);
