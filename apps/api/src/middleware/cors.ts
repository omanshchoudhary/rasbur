import cors from 'cors';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
    origin:
        env.NODE_ENV === 'production'
            ? ['https://rasbur.com']
            : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
});
