import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './db/mongodb.js';
import { logger } from './logger.js';

let isShuttingDown = false;

const startServer = async (): Promise<void> => {
    try {
        await connectDB();

        const server = app.listen(env.PORT, () => {
            logger.info(
                {
                    port: env.PORT,
                    environment: env.NODE_ENV,
                },
                'API server started'
            );
        });

        const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
            if (isShuttingDown) {
                return;
            }

            isShuttingDown = true;
            logger.info({ signal }, 'Shutdown signal received');

            server.close(async (serverError) => {
                if (serverError) {
                    logger.error({ err: serverError }, 'Error while closing HTTP server');
                    process.exit(1);
                }
                try {
                    await mongoose.disconnect();
                    logger.info('MongoDB disconnected');
                    process.exit(0);
                } catch (disconnectError) {
                    logger.error({ err: disconnectError }, 'Error while disconnecting MongoDB');
                    process.exit(1);
                }
            });
        };

        process.on('SIGINT', () => {
            void shutdown('SIGINT');
        });

        process.on('SIGTERM', () => {
            void shutdown('SIGTERM');
        });
    } catch (error) {
        logger.error({ err: error }, 'Failed to start API server');
        process.exit(1);
    }
};

void startServer();
