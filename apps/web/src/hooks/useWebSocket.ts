import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client"

type WebSocketStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type UseWebSocketOptions = {
    token?: string | null;
    autoConnect?: boolean;
}

type UseWebSocketResult = {
    socket: Socket | null;
    status: WebSocketStatus;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

export function useWebSocket({
    token,
    autoConnect = true,
}: UseWebSocketOptions = {}): UseWebSocketResult {
    // allows you to keep hold of the same socket instance even when the UI updates.
    const socketRef = useRef<Socket | null>(null);
    const [status, setStatus] = useState<WebSocketStatus>('idle');

    function connect() {
        if (socketRef.current?.connected) {
            return;
        }
        setStatus('connecting')

        const socket = io(API_BASE_URL || undefined, {
            autoConnect: false,
            transports: ['websocket', 'polling'],
            withCredentials: true,
            auth: token ? { token } : undefined,
        });

        socket.on('connect', () => {
            setStatus('connected');
        });

        socket.on('disconnect', () => {
            setStatus('disconnected');
        });

        socket.on('connect_error', () => {
            setStatus('error');
        });
        socketRef.current = socket;
        socket.connect();
    }

    function disconnect() {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setStatus('disconnected');
    }

    useEffect(() => {
        if (!autoConnect) {
            return;
        }
        connect();

        return () => {
            socketRef.current?.disconnect();
            socketRef.current = null;
        }
    }, [autoConnect, token])

    return {
        socket: socketRef.current,
        status,
        isConnected: status === 'connected',
        connect,
        disconnect,
    };
}