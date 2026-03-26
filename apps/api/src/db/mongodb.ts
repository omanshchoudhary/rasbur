import mongoose from 'mongoose';
import { logger } from '../logger.js';
import { env } from '../config/env.js';

export const connectDB = async (): Promise<void> => {
    try {
        await mongoose.connect(env.MONGODB_URI);
        logger.info('MongoDB connected');
    } catch (error) {
        logger.error({ err: error }, 'MongoDB connection failed');
        throw error;
    }

    mongoose.connection.on('error', (err) => {
        logger.error({ err }, 'MongoDB runtime error');
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
    });
};

export const disconnectDB = async (): Promise<void> => {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
};
