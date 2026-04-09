import { logger } from '../logger.js';
import type { AuthenticatedSocket } from './types.js';

type RoomAck = (response: { ok: boolean; room?: string; error?: string }) => void;

function canAccessRoom(userId: string, room: string): boolean {
    if (room == `user:${userId}`) {
        return true;
    }
    return room.startsWith(`decode:${userId}:`);
}

export function registerRoomHandlers(socket: AuthenticatedSocket): void {
    
    // Private Rooms For Each User
    const userRoom = `user:${socket.data.user.id}`;
    socket.join(userRoom);
    logger.info(
        { socketId: socket.id, userId: socket.data.user.id, room: userRoom },
        'Socket joined default user room'
    );

    socket.on('room:join', (room: string, ack?: RoomAck) => {
        if (!canAccessRoom(socket.data.user.id, room)) {
            ack?.({ ok: false, error: 'Room access denied' });
            return;
        }

        socket.join(room);
        ack?.({ ok: true, room });
    });

    socket.on('room:leave', (room: string, ack?: RoomAck) => {
        if (!canAccessRoom(socket.data.user.id, room)) {
            ack?.({ ok: false, error: 'Room access denied' });
            return;
        }

        socket.leave(room);
        ack?.({ ok: true, room });
    });
}
