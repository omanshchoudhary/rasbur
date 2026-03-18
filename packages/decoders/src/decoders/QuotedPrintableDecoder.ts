import { Decoder } from '../base/Decoder.js';

export class QuotedPrintableDecoder extends Decoder {
    readonly name = 'Quoted-Printable';

    confidence(input: string): number {
        if (!input) return 0;

        const hexPattern = /=[0-9A-Fa-f]{2}/g;
        const matches = input.match(hexPattern) || [];

        if (matches.length === 0) return 0;

        const ratio = matches.length / (input.length / 3);

        if (ratio > 0.2) return 0.9;
        if (ratio > 0.05) return 0.8;
        return 0.6;
    }

    decode(input: string): string | null {
        try {
            let result = '';
            let i = 0;

            while (i < input.length) {
                const char = input[i]!;

                if (char === '=') {
                    if (i + 1 < input.length && input[i + 1] === '\n') {
                        i += 2;
                        continue;
                    }

                    if (i + 2 < input.length) {
                        const nextTwo = input[i + 1]! + input[i + 2]!;

                        if (nextTwo === '\r\n') {
                            i += 3;
                            continue;
                        }

                        if (/^[0-9A-Fa-f]{2}$/.test(nextTwo)) {
                            result += String.fromCharCode(parseInt(nextTwo, 16));
                            i += 3;
                            continue;
                        }
                    }
                }

                result += char;
                i++;
            }

            if (result === input) return null;
            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded Quoted-Printable encoding — converts =XX hex escape sequences (common in email/MIME) to their character equivalents.';
    }
}
