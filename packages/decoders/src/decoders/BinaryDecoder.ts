import { Decoder } from '../base/Decoder.js';

export class BinaryDecoder extends Decoder {
    readonly name = 'Binary';

    confidence(input: string): number {
        if (!input) return 0;

        const cleanInput = input.replace(/[\s,]/g, '');

        if (!/^[01]+$/.test(cleanInput)) return 0;

        if (cleanInput.length % 8 !== 0) return 0;

        if (cleanInput.length < 8) return 0;

        const groups = input.trim().split(/[\s,]+/);
        if (groups.length > 1 && groups.every((g) => g.length === 8 && /^[01]+$/.test(g))) {
            return 0.95;
        }

        return 0.75;
    }

    decode(input: string): string | null {
        try {
            const cleanInput = input.replace(/[\s,]/g, '');

            if (cleanInput.length % 8 !== 0) return null;

            let result = '';
            for (let i = 0; i < cleanInput.length; i += 8) {
                const byte = parseInt(cleanInput.substring(i, i + 8), 2);
                result += String.fromCharCode(byte);
            }

            if (/[\x00-\x08\x0E-\x1F]/.test(result)) return null;

            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from binary encoding — each group of 8 bits (0s and 1s) represents one ASCII character.';
    }
}
