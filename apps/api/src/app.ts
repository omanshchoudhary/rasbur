import express from 'express';
import { env } from './config/env.js';
import { logger } from './logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';


// Routers
import { decodeRouter } from './routes/decode.js';





export const app = express();

app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        logger.info({
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
        });
    });
    next();
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
    });
});


app.use('/api', decodeRouter)


app.use((_req, res) => {
    res.status(404).json({
        error: 'Route not found',
    });
});
app.use(errorHandler);
