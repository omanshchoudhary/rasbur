import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../logger.js';

const websocketOrigins =
    env.NODE_ENV === 'production'
        ? ['https://rasbur.com']
        : ['http://localhost:5173', 'http://localhost:3000'];


export function createSocketServer(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: websocketOrigins,
            credentials: true
        }
    })

    io.on('connection', (socket) => {
        logger.info({ socketId: socket.id }, 'WebSocket client connected');

        socket.on('disconnect', (reason) => {
            logger.info({ socketId: socket.id, reason }, 'WebSocket client disconnected');
        });
    });

    return io;
}