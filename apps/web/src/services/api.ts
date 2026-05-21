import type {
    BatchDecodeResult,
    DecodeOptions,
    DecodeResult,
    DecoderInfo,
    IdentifyResult,
    User,
} from '@rasbur/shared';
import { getAccessToken, getRefreshToken, saveAuthTokens, clearAuthTokens } from './auth.js';


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {

    // Create the headers part here
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> ?? {}),
    }

    const token = getAccessToken();
    // Attach token to the headers
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    let response = await fetch(`${API_BASE_URL}${path}`, {
        headers,
        ...init,
    });

    // For invalid token, try refreshing it with Refresh Token
    if (response.status === 401 && path !== '/auth/refresh') {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Sending refresh tokens in body
                    body: JSON.stringify({ refreshToken }),
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json() as { accessToken: string; refreshToken: string };
                    saveAuthTokens(data.accessToken, data.refreshToken);

                    // Retry with the main request
                    headers['Authorization'] = `Bearer ${data.accessToken}`;
                    response = await fetch(`${API_BASE_URL}${path}`, {
                        ...init,
                        headers,
                    });
                } else {

                    // Refresh token invalid/expired
                    clearAuthTokens();
                    window.location.href = '/login';
                }
            } catch {
                clearAuthTokens();
                window.location.href = '/login';
            }

        }
    }
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

    getUserProfile(): Promise<{ ok: boolean; user: User }> {
        return request<{ ok: boolean; user: User }>('/api/me', {
            method: 'GET',
        });
    },

    updateUserProfile(data: { name?: string; avatar?: string }): Promise<{ ok: boolean; user: User }> {
        return request<{ ok: boolean; user: User }>('/api/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }
};
