import { Router } from 'express';
import { createShareLink, getShare } from '../controllers/share.controller.js';
import { authenticate, requirePermission } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { shareLinkSchema } from '@rasbur/shared';
export const shareRouter = Router();

shareRouter.post(
    '/share',
    authenticate,
    requirePermission('share'),
    validate({ body: shareLinkSchema }),
    createShareLink
);
shareRouter.get('/share/:slug', getShare);
