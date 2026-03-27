import express from 'express';
import { env } from './config/env.js';
import { logger } from './logger.js';
import { corsMiddleware } from './middleware/cors.js';
import { securityMiddleware } from './middleware/security.js';
import { errorHandler } from './middleware/errorHandler.js';
import { randomUUID } from 'node:crypto';

// Routers
import { decodeRouter } from './routes/decode.js';

type RequestWithId = express.Request & {
    requestId: string;
};

export const app = express();

// Middlewares

app.use(securityMiddleware);
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generates a unique ID for every incoming request
app.use((req, res, next) => {
    const requestId = randomUUID();
    const request = req as RequestWithId;
    request.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
});

app.use((req, res, next) => {
    const request = req as RequestWithId;
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
        logger.info({
            requestId: request.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
        });
    });
    next();
});

app.get('/health', (req, res) => {
    const request = req as RequestWithId;
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
        requestId: request.requestId,
    });
});

app.use('/api', decodeRouter);

app.use((_req, res) => {
    res.status(404).json({
        error: 'Route not found',
    });
});
app.use(errorHandler);
