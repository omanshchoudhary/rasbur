import { Decoder } from '../base/Decoder.js';

export class UnicodeEscapeDecoder extends Decoder {
    readonly name = 'Unicode Escape';

    confidence(input: string): number {
        if (!input) return 0;

        const hex4Pattern = /\\u[0-9a-fA-F]{4}/g;
        const hex2Pattern = /\\x[0-9a-fA-F]{2}/g;
        const hex8Pattern = /\\U[0-9a-fA-F]{8}/g;

        const hex4Count = (input.match(hex4Pattern) || []).length;
        const hex2Count = (input.match(hex2Pattern) || []).length;
        const hex8Count = (input.match(hex8Pattern) || []).length;

        const total = hex4Count + hex2Count + hex8Count;

        if (total === 0) return 0;
        if (hex4Count > 0 || hex8Count > 0) return 0.95;
        if (hex2Count > 0) return 0.8;
        return 0.7;
    }

    decode(input: string): string | null {
        try {
            let result = input;

            result = result.replace(/\\u([0-9a-fA-F]{4})/g, (_: string, hex: string) => {
                return String.fromCharCode(parseInt(hex, 16));
            });

            result = result.replace(/\\x([0-9a-fA-F]{2})/g, (_: string, hex: string) => {
                return String.fromCharCode(parseInt(hex, 16));
            });

            result = result.replace(/\\U([0-9a-fA-F]{8})/g, (_: string, hex: string) => {
                const code = parseInt(hex, 16);
                return String.fromCodePoint(code);
            });

            if (result === input) return null;
            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded Unicode escape sequences — handles \\u0048 (4 hex), \\x48 (2 hex), and \\U00000048 (8 hex) formats to their character equivalents.';
    }
}
