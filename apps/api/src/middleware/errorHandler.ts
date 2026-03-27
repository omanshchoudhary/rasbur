import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../logger.js';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public isOperational = true
    ) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
    }
}
type RequestWithId = Request & {
    requestId?: string;
};

export const errorHandler = (
    err: Error,
    req: RequestWithId,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            requestId: req.requestId,
        });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({
            status: 'error',
            message: 'Validation error',
            errors: err.issues,
            requestId: req.requestId,
        });
        return;
    }
    logger.error(
        {
            err,
            requestId: req.requestId,
            path: req.originalUrl,
            method: req.method,
        },
        'Unhandled request error'
    );
    res.status(500).json({
        status: 'error',
        message: 'Internal server error',
        requestId: req.requestId,
    });
};
