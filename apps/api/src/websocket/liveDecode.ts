import { decodePipeline, registerDecoders } from '@rasbur/decoders';
import { decodeRequestSchema } from '@rasbur/shared';
import { logger } from '../logger.js';
import type { AuthenticatedSocket } from './types.js';

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

export function registerLiveDecodeHandler(socket: AuthenticatedSocket): void {
    socket.on('decode:live', (payload: unknown, ack?: LiveDecodeAck) => {
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

            socket.emit('decode:live:result', response);
            ack?.(response);
            return;
        }

        try {
            registerDecoders();
            const result = decodePipeline.decode(parsed.data.input, parsed.data.options);

            const response: LiveDecodeSuccess = {
                ok: true,
                result,
            };
            socket.emit('decode:live:result', response);
            ack?.(response);
        } catch (error) {
            logger.error(
                { err: error, socketId: socket.id, userId: socket.data.user.id },
                'decode:live handler failed'
            );

            const response: LiveDecodeError = {
                ok: false,
                error: 'Failed to decode live input',
            };

            socket.emit('decode:live:result', response);
            ack?.(response);
        }
    });
}
