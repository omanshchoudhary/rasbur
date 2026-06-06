import { Router } from 'express';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { apiKeySchema, updateApiKeySchema } from '@rasbur/shared';
import {
    createApiKey,
    listApiKeys,
    deleteApiKey,
    updateApiKey,
    getApiKeyUsage,
} from '../controllers/apiKey.controller.js';

export const apiKeyRouter = Router();

apiKeyRouter.post('/keys', jwtAuthMiddleware, validate({ body: apiKeySchema }), createApiKey);

/**
 * @openapi
 * /api/keys:
 *   get:
 *     summary: List API keys for the authenticated user
 *     tags:
 *       - API Keys
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKeyListItem'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: 'Unauthorized: User ID not found'
 */
apiKeyRouter.get('/keys', jwtAuthMiddleware, listApiKeys);

apiKeyRouter.delete('/keys/:id', jwtAuthMiddleware, deleteApiKey);
apiKeyRouter.patch(
    '/keys/:id',
    jwtAuthMiddleware,
    validate({ body: updateApiKeySchema }),
    updateApiKey
);

apiKeyRouter.get('/keys/:id/usage', jwtAuthMiddleware, getApiKeyUsage);
