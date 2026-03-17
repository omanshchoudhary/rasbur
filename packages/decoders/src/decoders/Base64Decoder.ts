import { Decoder } from '../base/Decoder.js';

export class Base64Decoder extends Decoder {
    readonly name = 'Base64';

    confidence(input: string): number {
        if (!input) return 0;

        const cleanInput = input.replace(/\s+/g, '');
        // Base64 strings must be divisible by 4 characters.
        if (cleanInput.length % 4 !== 0) return 0;

        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(cleanInput)) return 0;

        if (cleanInput.length < 4) return 0;

        if (cleanInput.endsWith('=')) return 0.9;

        return 0.8;
    }

    decode(input: string): string | null {
        try {
            const cleanInput = input.replace(/\s+/g, '');
            const decoded = Buffer.from(cleanInput, 'base64').toString('utf-8');

            if (/[\x00-\x08\x0E-\x1F]/.test(decoded)) return null;

            return decoded;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from Base64 encoding — a scheme that represents binary data using 64 ASCII characters (A-Z, a-z, 0-9, +, /) with = padding.';
    }
}
