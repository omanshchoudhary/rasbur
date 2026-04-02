import type {
    BatchDecodeResult,
    DecodeOptions,
    DecodeResult,
    DecoderInfo,
    IdentifyResult,
} from '@rasbur/shared';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers ?? {}),
        },
        ...init,
    });

    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }

    return response.json() as Promise<T>;
}

export const api = {
    getDecoders(): Promise<DecoderInfo[]> {
        return request<DecoderInfo[]>('/api/decoders');
    },

    decode(input: string, options?: DecodeOptions): Promise<DecodeResult> {
        return request<DecodeResult>('/api/decode', {
            method: 'POST',
            body: JSON.stringify({ input, options }),
        });
    },

    identify(input: string): Promise<IdentifyResult> {
        return request<IdentifyResult>('/api/identify', {
            method: 'POST',
            body: JSON.stringify({ input }),
        });
    },

    batchDecode(inputs: string[]): Promise<BatchDecodeResult> {
        return request<BatchDecodeResult>('/api/decode/batch', {
            method: 'POST',
            body: JSON.stringify({ inputs }),
        });
    },
};
