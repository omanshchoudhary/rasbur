import { Decoder } from '../base/Decoder.js';
import {
    ENGLISH_FREQ,
    englishLikeness,
    commonLetterRatio,
    bigramCommonRatio,
    rareLetterRatio,
} from '../utils/textScore.js';

// Chi-squared can't beat random noise below this many letters
const MIN_LETTERS = 6;
// The winning shift must beat the original text's chi by this factor,
// which rejects both plain English (no shift helps) and pure gibberish
// (every shift is equally bad).
const IMPROVEMENT_FACTOR = 1.3;
// English text rarely exceeds this chi-squared-per-letter, even when short
const MAX_CHI = 3.5;
// Real English keeps j/q/x/z under ~2% of letters
const MAX_RARE_RATIO = 0.05;

interface ShiftResult {
    shift: number;
    text: string;
    chi: number;
}

export class CaesarCipherDecoder extends Decoder {
    readonly name = 'Caesar Cipher';

    confidence(input: string): number {
        const best = this.analyze(input);
        if (!best) return 0;

        const quality = englishLikeness(best.text);
        if (quality >= 0.8) return 0.85;
        return 0.65;
    }

    decode(input: string): string | null {
        const best = this.analyze(input);
        if (!best) return null;

        return `[Shift: ${best.shift}] ${best.text}`;
    }

    explain(): string {
        return 'Decoded Caesar Cipher — tried all 25 possible shifts and scored each against English letter frequency to find the best match.';
    }

    // Shared gatekeeper for confidence() and decode() so they always agree.
    private analyze(input: string): ShiftResult | null {
        if (!input) return null;
        if (!/[a-zA-Z]/.test(input)) return null;

        // Reject strings that look like encoded data (digits, =, +, /)
        const alphaSpaceRatio = (input.match(/[a-zA-Z\s.,!?'-]/g) || []).length / input.length;
        if (alphaSpaceRatio < 0.9) return null;

        const letterCount = (input.match(/[a-zA-Z]/g) || []).length;
        if (letterCount < MIN_LETTERS) return null;

        const originalChi = this.chiSquared(input);
        const best = this.bestShift(input);

        if (originalChi <= best.chi * IMPROVEMENT_FACTOR) return null;
        if (best.chi > MAX_CHI) return null;
        if (rareLetterRatio(best.text) > MAX_RARE_RATIO) return null;
        if (englishLikeness(best.text) < 0.7) return null;
        // Real words have real letter pairs — rotated soup does not
        if (bigramCommonRatio(best.text) < 0.25) return null;

        return best;
    }

    private shift(input: string, shift: number): string {
        return input.replace(/[a-zA-Z]/g, (char) => {
            const base = char <= 'Z' ? 65 : 97;
            return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
        });
    }

    // Chi-squared distance from English letter frequency, per letter.
    // Lower = more English-like.
    private chiSquared(text: string): number {
        const letters = text.toLowerCase().replace(/[^a-z]/g, '');
        if (letters.length === 0) return Infinity;

        const counts: Record<string, number> = {};
        for (const letter of letters) {
            counts[letter] = (counts[letter] ?? 0) + 1;
        }

        let chi = 0;
        for (const [letter, freq] of Object.entries(ENGLISH_FREQ)) {
            const expected = (freq / 100) * letters.length;
            const observed = counts[letter] ?? 0;
            chi += (observed - expected) ** 2 / Math.max(expected, 0.1);
        }

        return chi / letters.length;
    }

    // Selects by chi minus common-letter and bigram bonuses rather than chi
    // alone: on short texts a repeated letter (the "ll" in hello) inflates
    // the true shift's chi enough for a gibberish shift to win on raw chi,
    // and only bigram structure ("he", "ll", "lo") breaks that tie.
    private bestShift(input: string): ShiftResult {
        let best: ShiftResult | null = null;
        let bestRank = Infinity;

        for (let shift = 1; shift <= 25; shift++) {
            const text = this.shift(input, shift);
            const chi = this.chiSquared(text);
            const rank = chi - 3.0 * commonLetterRatio(text) - 4.0 * bigramCommonRatio(text);
            if (rank < bestRank) {
                bestRank = rank;
                best = { shift, text, chi };
            }
        }

        return best!;
    }
}
