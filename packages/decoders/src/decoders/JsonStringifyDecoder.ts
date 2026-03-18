import { Decoder } from '../base/Decoder.js';

export class JsonStringifyDecoder extends Decoder {
    readonly name = 'JSON Stringify';

    confidence(input: string): number {
        if (!input) return 0;

        const escapedPatterns = /\\n|\\r|\\t|\\b|\\f|\\"|\\\\/g;
        const matches = input.match(escapedPatterns) || [];

        if (matches.length === 0) return 0;
        if (matches.length >= 3) return 0.95;
        if (matches.length >= 1) return 0.8;
        return 0;
    }

    decode(input: string): string | null {
        try {
            let result = input;

            result = result.replace(/\\n/g, '\n');
            result = result.replace(/\\r/g, '\r');
            result = result.replace(/\\t/g, '\t');
            result = result.replace(/\\b/g, '\b');
            result = result.replace(/\\f/g, '\f');
            result = result.replace(/\\\\/g, '\\');
            result = result.replace(/\\"/g, '"');

            if (result === input) return null;
            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded JSON.stringify escaped sequences — converts \\n, \\t, \\", \\\\, etc. to their actual character representations.';
    }
}
