import { Router } from "express";
import { jwtAuthMiddleware } from "../middleware/auth.js";
import { getCurrentUser, updateCurrentUser } from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import { updateCurrentUserSchema } from "@rasbur/shared";

export const userRouter = Router();

userRouter.get('/me', jwtAuthMiddleware, getCurrentUser)
userRouter.patch('/me', jwtAuthMiddleware, validate({ body: updateCurrentUserSchema }), updateCurrentUser)