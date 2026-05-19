import { Router } from "express";
import { jwtAuthMiddleware } from "../middleware/auth.js";
import { getCurrentUser } from "../controllers/user.controller.js";

export const userRouter = Router();

userRouter.get('/me', jwtAuthMiddleware, getCurrentUser)
