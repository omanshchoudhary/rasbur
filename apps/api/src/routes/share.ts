import { Router, type Request, type Response } from 'express';
import { createShareLink, getShare } from '../controllers/share.controller.js';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { shareLinkSchema } from '@rasbur/shared';
export const shareRouter = Router();

shareRouter.post('/share',jwtAuthMiddleware,validate({body: shareLinkSchema}), createShareLink);
shareRouter.get('/share/:slug', getShare);