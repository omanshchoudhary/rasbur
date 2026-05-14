import { decodePipeline, registerDecoders } from '@rasbur/decoders';
import { decodeRequestSchema } from '@rasbur/shared';
import { logger } from '../logger.js';
import type { AuthenticatedSocket } from './types.js';
import { checkWebSocketRateLimit } from './rateLimit.js';

const LIVE_DECODE_DEBOUNCE_MS = 250;
const LIVE_DECODE_WINDOW_MS = 10_000;
const LIVE_DECODE_MAX_EVENTS = 40;

type LiveDecodeSuccess = {
    ok: true;
    result: ReturnType<typeof decodePipeline.decode>;
};

type LiveDecodeError = {
    ok: false;
    error: string;
    issues?: Array<{ path: string; message: string }>;
};

type LiveDecodeResponse = LiveDecodeSuccess | LiveDecodeError;
type LiveDecodeAck = (response: LiveDecodeResponse) => void;

type PendingLiveDecodeEvent = {
    payload: unknown;
    ack?: LiveDecodeAck;
};

function emitLiveDecodeResult(
    socket: AuthenticatedSocket,
    response: LiveDecodeResponse,
    ack?: LiveDecodeAck
): void {
    socket.emit('decode:live:result', response);
    ack?.(response);
}

function processLiveDecode(
    socket: AuthenticatedSocket,
    payload: unknown,
    ack?: LiveDecodeAck
): void {
    const parsed = decodeRequestSchema.safeParse(payload);

    if (!parsed.success) {
        const response: LiveDecodeError = {
            ok: false,
            error: 'Validation error',
            issues: parsed.error.issues.map((issue) => ({
                path: issue.path.join('.') || 'input',
                message: issue.message,
            })),
        };

        emitLiveDecodeResult(socket, response, ack);
        return;
    }

    try {
        registerDecoders();
        const result = decodePipeline.decode(parsed.data.input, parsed.data.options);

        const response: LiveDecodeSuccess = {
            ok: true,
            result,
        };

        emitLiveDecodeResult(socket, response, ack);
    } catch (error) {
        logger.error(
            { err: error, socketId: socket.id, userId: socket.data.user.id },
            'decode:live handler failed'
        );

        const response: LiveDecodeError = {
            ok: false,
            error: 'Failed to decode live input',
        };

        emitLiveDecodeResult(socket, response, ack);
    }
}

function acknowledgeSupersededLiveDecode(ack?: LiveDecodeAck): void {
    ack?.({
        ok: false,
        error: 'Superseded by a newer live decode input.',
    });
}

function acknowledgeCancelledLiveDecode(ack?: LiveDecodeAck): void {
    ack?.({
        ok: false,
        error: 'Live decode request cancelled because the socket disconnected.',
    });
}

export function registerLiveDecodeHandler(socket: AuthenticatedSocket): void {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingEvent: PendingLiveDecodeEvent | null = null;
    const processedDecodeTimestamps: number[] = [];

    socket.on('decode:live', (payload: unknown, ack?: LiveDecodeAck) => {
        if (pendingEvent?.ack) {
            acknowledgeSupersededLiveDecode(pendingEvent.ack);
        }

        pendingEvent = { payload, ack };

        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(async () => {
            if (!pendingEvent) {
                return;
            }

            const now = Date.now();

            while (
                processedDecodeTimestamps.length > 0 &&
                now - processedDecodeTimestamps[0]! > LIVE_DECODE_WINDOW_MS
            ) {
                processedDecodeTimestamps.shift();
            }

            if (processedDecodeTimestamps.length >= LIVE_DECODE_MAX_EVENTS) {
                logger.warn(
                    { socketId: socket.id, userId: socket.data.user.id },
                    'decode:live throttled due to high decode rate'
                );

                const throttledEvent = pendingEvent;
                pendingEvent = null;

                emitLiveDecodeResult(
                    socket,
                    {
                        ok: false,
                        error: 'Too many live decode requests. Please slow down.',
                    },
                    throttledEvent.ack
                );
                return;
            }

            const eventToProcess = pendingEvent;
            pendingEvent = null;

            const rateLimit = await checkWebSocketRateLimit(socket.data.user.id);
            if (!rateLimit.allowed) {
                logger.warn(
                    {
                        socketId: socket.id,
                        userId: socket.data.user.id,
                        limit: rateLimit.limit,
                        resetSeconds: rateLimit.resetSeconds,
                    },
                    'decode:live blocked by per-user websocket rate limit'
                );

                emitLiveDecodeResult(
                    socket,
                    {
                        ok: false,
                        error: 'Too many live decode requests. Please wait before trying again.',
                    },
                    eventToProcess.ack
                );
                return;
            }

            processedDecodeTimestamps.push(now);

            processLiveDecode(socket, eventToProcess.payload, eventToProcess.ack);
        }, LIVE_DECODE_DEBOUNCE_MS);
    });

    socket.on('disconnect', () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }

        if (pendingEvent?.ack) {
            acknowledgeCancelledLiveDecode(pendingEvent.ack);
        }

        pendingEvent = null;
    });
}
