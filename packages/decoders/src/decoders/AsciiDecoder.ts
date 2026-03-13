import { Decoder } from '../base/Decoder.js';

export class AsciiDecoder extends Decoder {
    readonly name = 'ASCII';

    confidence(input: string): number {
        if (!input) return 0;

        const parts = input.trim().split(/[\s,]+/);

        if (parts.length < 2) return 0;

        const numbers = parts.map(Number);
        if (numbers.some(isNaN)) return 0;

        const validRange = numbers.every(
            (n) => (n >= 32 && n <= 126) || n === 9 || n === 10 || n === 13
        );
        if (!validRange) return 0;

        const letterCount = numbers.filter(
            (n) => (n >= 65 && n <= 90) || (n >= 97 && n <= 122)
        ).length;
        const letterRatio = letterCount / numbers.length;

        if (letterRatio > 0.5) return 0.9;
        return 0.75;
    }

    decode(input: string): string | null {
        try {
            const parts = input.trim().split(/[\s,]+/);
            const numbers = parts.map(Number);

            if (numbers.some(isNaN)) return null;

            const result = numbers.map((n) => String.fromCharCode(n)).join('');

            if (/[\x00-\x08\x0E-\x1F]/.test(result)) return null;

            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from ASCII decimal codes — each number represents a character in the ASCII table (e.g., 72 = H, 101 = e).';
    }
}
