import { Decoder } from '../base/Decoder.js';

const ENGLISH_FREQ: Record<string, number> = {
    e: 12.7,
    t: 9.1,
    a: 8.2,
    o: 7.5,
    i: 7.0,
    n: 6.9,
    s: 6.3,
    h: 6.1,
    r: 6.0,
    d: 4.3,
    l: 4.0,
    c: 2.8,
    u: 2.8,
    m: 2.4,
    w: 2.4,
    f: 2.2,
    g: 2.0,
    y: 2.0,
    p: 1.9,
    b: 1.5,
    v: 1.0,
    k: 0.8,
    j: 0.15,
    x: 0.15,
    q: 0.1,
    z: 0.07,
};

export class CaesarCipherDecoder extends Decoder {
    readonly name = 'Caesar Cipher';

    confidence(input: string): number {
        if (!input) return 0;
        if (!/[a-zA-Z]/.test(input)) return 0;

        // Reject strings that look like encoded data (digits, =, +, /)
        const alphaSpaceRatio =
            (input.match(/[a-zA-Z\s.,!?'-]/g) || []).length / input.length;
        if (alphaSpaceRatio < 0.9) return 0;

        const originalScore = this.score(input);
        const results = this.tryAllShifts(input);
        const best = results[0]!;

        if (best.score < 0.15) return 0;

        // Original already reads like English — no need to decode
        if (originalScore > 4.5) return 0;
        // Shift must produce meaningfully better English
        if (best.score <= originalScore * 1.5) return 0;

        // Check that decoded text contains recognizable English words
        const words = best.text.toLowerCase().split(/\W+/).filter((w) => w.length >= 3);
        const commonWords = ['the','and','for','are','but','not','you','all','can','had',
            'her','was','one','our','out','has','have','from','this','that','with','hello','world'];
        const wordMatches = words.filter((w) => commonWords.includes(w)).length;
        if (words.length > 0 && wordMatches === 0) return 0;

        if (best.score > 0.3) return 0.9;
        if (best.score > 0.15) return 0.75;
        return 0.5;
    }

    decode(input: string): string | null {
        const results = this.tryAllShifts(input);
        const best = results[0]!;

        if (best.score < 0.15) return null;
        return `[Shift: ${best.shift}] ${best.text}`;
    }

    explain(): string {
        return 'Decoded Caesar Cipher — tried all 25 possible shifts and scored each against English letter frequency to find the best match.';
    }

    private shift(input: string, shift: number): string {
        return input.replace(/[a-zA-Z]/g, (char) => {
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
        });
    }

    private score(text: string): number {
        const lower = text.toLowerCase();
        let score = 0;
        let total = 0;

        for (const char of lower) {
            if (ENGLISH_FREQ[char] !== undefined) {
                score += ENGLISH_FREQ[char]!;
                total++;
            }
        }

        return total > 0 ? score / total : 0;
    }

    private tryAllShifts(input: string): { shift: number; text: string; score: number }[] {
        const results: { shift: number; text: string; score: number }[] = [];

        const commonWords = ['the','and','for','are','but','not','you','all','can','had',
            'her','was','one','our','out','has','have','from','this','that','with','hello','world'];

        for (let shift = 1; shift <= 25; shift++) {
            const decoded = this.shift(input, shift);
            let score = this.score(decoded);
            
            // Short texts have unreliable letter frequencies. 
            // Give a massive bonus to shifts that produce actual English words.
            const words = decoded.toLowerCase().split(/\W+/).filter((w) => w.length >= 3);
            const wordMatches = words.filter((w) => commonWords.includes(w)).length;
            
            if (wordMatches > 0) {
                // Large bonus per word match to ensure it outranks gibberish
                score += wordMatches * 5.0; 
            }

            results.push({ shift, text: decoded, score });
        }

        results.sort((a, b) => b.score - a.score);
        return results;
    }
}
