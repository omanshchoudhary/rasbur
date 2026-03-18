import { Decoder } from '../base/Decoder.js';

const BASE = 36;
const TMIN = 1;
const TMAX = 26;
const DAMP = 700;
const INITIAL_BIAS = 72;
const INITIAL_N = 0x80;

export class PunycodeDecoder extends Decoder {
    readonly name = 'Punycode';

    confidence(input: string): number {
        if (!input) return 0;

        const parts = input.split('.');
        const hasPunyPart = parts.some((p) => p.startsWith('xn--'));

        if (!hasPunyPart) return 0;
        return 0.95;
    }

    decode(input: string): string | null {
        try {
            const parts = input.split('.');

            const decoded = parts
                .map((part) => {
                    if (part.startsWith('xn--')) {
                        return this.decodeLabel(part.slice(4));
                    }
                    return part;
                })
                .join('.');

            if (decoded === input) return null;
            return decoded;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from Punycode — converts internationalized domain names (IDN) with xn-- prefix to their Unicode representation.';
    }

    private decodeLabel(encoded: string): string {
        if (encoded === '') return '';

        // Step 1: Extract basic code points (everything before the last '-')
        const output: number[] = [];
        const hyphenIndex = encoded.lastIndexOf('-');

        let consumeFrom = 0;
        if (hyphenIndex >= 0) {
            for (let j = 0; j < hyphenIndex; j++) {
                output.push(encoded.charCodeAt(j));
            }
            consumeFrom = hyphenIndex + 1;
        }

        // Step 2: Decode extended characters
        let n = INITIAL_N;
        let i = 0;
        let bias = INITIAL_BIAS;
        let pos = consumeFrom;

        while (pos < encoded.length) {
            const oldi = i;
            let w = 1;

            for (let k = BASE; ; k += BASE) {
                if (pos >= encoded.length) return encoded;
                const code = encoded.charCodeAt(pos++);
                let digit: number;

                if (code >= 97 && code <= 122) {
                    digit = code - 97;          // a-z → 0-25
                } else if (code >= 65 && code <= 90) {
                    digit = code - 65;          // A-Z → 0-25
                } else if (code >= 48 && code <= 57) {
                    digit = code - 48 + 26;     // 0-9 → 26-35
                } else {
                    return encoded;
                }

                i += digit * w;

                const t = Math.max(TMIN, Math.min(TMAX, k - bias));
                if (digit < t) break;
                w *= (BASE - t);
            }

            const len = output.length + 1;
            bias = this.adaptBias(i - oldi, len, oldi === 0);
            n += Math.floor(i / len);
            i = i % len;

            output.splice(i, 0, n);
            i++;
        }

        return String.fromCodePoint(...output);
    }

    private adaptBias(delta: number, numPoints: number, firstTime: boolean): number {
        delta = firstTime ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
        delta += Math.floor(delta / numPoints);

        let k = 0;
        while (delta > Math.floor(((BASE - TMIN) * TMAX) / 2)) {
            delta = Math.floor(delta / (BASE - TMIN));
            k += BASE;
        }

        return k + Math.floor(((BASE - TMIN + 1) * delta) / (delta + 38));
    }
}
