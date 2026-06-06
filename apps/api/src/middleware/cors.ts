import cors from 'cors';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
    origin:
        env.NODE_ENV === 'production'
            ? [env.FRONTEND_URL]
            : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
});
