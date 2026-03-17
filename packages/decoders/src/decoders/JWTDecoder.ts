import { Decoder } from '../base/Decoder.js';

export class JWTDecoder extends Decoder {
    readonly name = 'JWT';

    confidence(input: string): number {
        const parts = input.trim().split('.');
        if (parts.length !== 3) return 0;

        const [header, payload, signature] = parts;
        if (!header || !payload || !signature) return 0;

        const base64urlRegex = /^[A-Za-z0-9_-]+$/;

        if (!base64urlRegex.test(header) || !base64urlRegex.test(payload)) return 0;

        try {
            const headerJson = Buffer.from(header, 'base64url').toString('utf-8');
            const payloadJson = Buffer.from(payload, 'base64url').toString('utf-8');

            const headerObj = JSON.parse(headerJson);
            const payloadObj = JSON.parse(payloadJson);

            if (!headerObj.alg || (!payloadObj.exp && !payloadObj.iat)) return 0;
            return 0.95;
        } catch {
            return 0;
        }
    }

    decode(input: string): string | null {
        try {
            const parts = input.trim().split('.');
            if (parts.length !== 3) return null;
            const header = parts[0]!;
            const payload = parts[1]!;
            const headerObj = JSON.parse(Buffer.from(header, 'base64url').toString('utf-8'));
            const payloadObj = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
            return JSON.stringify({ header: headerObj, payload: payloadObj }, null, 2);
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded JWT (JSON Web Token) — split into header, payload (claims), and signature. Shows the JSON structure of header and payload.';
    }
}
