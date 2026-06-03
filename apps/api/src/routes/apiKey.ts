import { Router } from 'express';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { apiKeySchema } from '@rasbur/shared';
import { createApiKey } from '../controllers/apiKey.controller.js';

export const apiKeyRouter = Router();

apiKeyRouter.post('/keys', jwtAuthMiddleware, validate({ body: apiKeySchema }), createApiKey);
