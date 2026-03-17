import { Decoder } from '../base/Decoder.js';

export class UrlDecoder extends Decoder {
    readonly name = 'URL';

    confidence(input: string): number {
        if (!input) return 0;

        const percentPattern = /%[0-9A-Fa-f]{2}/g;
        // Count matches
        const matches = input.match(percentPattern);

        if (!matches || matches.length === 0) return 0;
        // How much of the string is encoded
        const ratio = (matches.length * 3) / input.length;

        if (ratio > 0.3) return 0.95;
        if (ratio > 0.1) return 0.85;
        return 0.7;
    }

    decode(input: string): string | null {
        try {
            const decoded = decodeURIComponent(input);

            if (decoded === input) return null;

            return decoded;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from URL encoding (percent-encoding) — a mechanism that replaces unsafe characters with %HH hex values for use in URIs.';
    }
}
