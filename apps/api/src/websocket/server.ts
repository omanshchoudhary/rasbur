import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from '../config/env.js';
import { logger } from '../logger.js';
import { attachSocketAuth } from './auth.js';
import { AuthenticatedSocket } from './types.js';
import { registerRoomHandlers } from './rooms.js';

const websocketOrigins =
    env.NODE_ENV === 'production'
        ? ['https://rasbur.com']
        : ['http://localhost:5173', 'http://localhost:3000'];

export function createSocketServer(httpServer: HttpServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: websocketOrigins,
            credentials: true,
        },
    });

    // Authenticate The Socket With JWT
    attachSocketAuth(io);

    io.on('connection', (rawSocket) => {
        const socket = rawSocket as AuthenticatedSocket;
        logger.info(
            {
                socketId: socket.id,
                userId: socket.data.user.id,
            },
            'WebSocket client connected'
        );
        registerRoomHandlers(socket);

        socket.on('disconnect', (reason) => {
            logger.info(
                {
                    socketId: socket.id,
                    userId: socket.data.user.id,
                    reason,
                },
                'WebSocket client disconnected'
            );
        });
    });

    return io;
}
