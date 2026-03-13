import { Decoder } from '../base/Decoder.js';

export class ROT13Decoder extends Decoder {
    readonly name = 'ROT13';

    confidence(input: string): number {
        if (!input) return 0;

        if (!/[a-zA-Z]/.test(input)) return 0;

        const decoded = this.rot13(input);
        const commonWords = [
            'the',
            'and',
            'for',
            'are',
            'but',
            'not',
            'you',
            'all',
            'can',
            'had',
            'her',
            'was',
            'one',
            'our',
            'out',
            'has',
            'have',
            'from',
            'this',
            'that',
            'with',
            'http',
            'www',
        ];

        const lowerDecoded = decoded.toLowerCase();
        const words = lowerDecoded.split(/\W+/).filter((w) => w.length >= 3);

        if (words.length === 0) return 0;

        const matchCount = words.filter((w) => commonWords.includes(w)).length;
        const ratio = matchCount / words.length;

        const lowerInput = input.toLowerCase();
        const originalWords = lowerInput.split(/\W+/).filter((w) => w.length >= 3);
        const originalMatchCount = originalWords.filter((w) => commonWords.includes(w)).length;

        if (originalMatchCount >= matchCount) return 0;

        if (ratio > 0.3) return 0.85;
        if (ratio > 0.15) return 0.6;
        return 0;
    }

    decode(input: string): string | null {
        try {
            const decoded = this.rot13(input);

            if (decoded === input) return null;

            return decoded;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from ROT13 — a simple letter substitution cipher that shifts each letter 13 positions in the alphabet.';
    }

    private rot13(input: string): string {
        return input.replace(/[a-zA-Z]/g, (char) => {
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - base + 13) % 26) + base);
        });
    }
}
