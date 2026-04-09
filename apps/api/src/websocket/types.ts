import { Socket } from "socket.io";

export type SocketUser = {
    id: string;
    email?: string;
    tier?: string;
};

// Extending Default Socket Type
export type AuthenticatedSocket = Socket & {
    data: Socket['data'] & {
        user: SocketUser;
    };
};
