import { Decoder } from '../base/Decoder.js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export class Base32Decoder extends Decoder {
    readonly name = 'Base32';

    confidence(input: string): number {
        if (!input) return 0;

        const cleanInput = input.replace(/\s+/g, '').toUpperCase();

        if (cleanInput.length % 8 !== 0) return 0;

        const base32Regex = /^[A-Z2-7]+=*$/;
        if (!base32Regex.test(cleanInput)) return 0;

        if (cleanInput.length < 8) return 0;

        const paddingMatch = cleanInput.match(/=+$/);
        if (paddingMatch) {
            const padLen = paddingMatch[0].length;
            if (![1, 3, 4, 6].includes(padLen)) return 0;
            return 0.9;
        }

        if (input === input.toUpperCase()) return 0.75;

        return 0.65;
    }

    decode(input: string): string | null {
        try {
            const cleanInput = input.replace(/\s+/g, '').toUpperCase().replace(/=+$/, '');

            let bits = '';
            for (const char of cleanInput) {
                const index = BASE32_ALPHABET.indexOf(char);
                if (index === -1) return null;
                bits += index.toString(2).padStart(5, '0');
            }

            const byteCount = Math.floor(bits.length / 8);
            let result = '';

            for (let i = 0; i < byteCount; i++) {
                const byte = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
                result += String.fromCharCode(byte);
            }

            if (!result) return null;

            if (/[\x00-\x08\x0E-\x1F]/.test(result)) return null;

            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from Base32 encoding (RFC 4648) — a scheme that represents binary data using 32 characters (A-Z, 2-7) with = padding.';
    }
}
