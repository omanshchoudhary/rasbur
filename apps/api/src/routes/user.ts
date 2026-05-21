import { updateCurrentUserSchema } from '@rasbur/shared';
import { Router } from 'express';
import { getCurrentUser, updateCurrentUser } from '../controllers/user.controller.js';
import { jwtAuthMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const userRouter = Router();

userRouter.get('/me', jwtAuthMiddleware, getCurrentUser);
userRouter.patch('/me', jwtAuthMiddleware, validate({ body: updateCurrentUserSchema }), updateCurrentUser);
