import { Decoder } from '../base/Decoder.js';

export class HexDecoder extends Decoder {
    readonly name = 'Hex';

    // Strip "0x" only at the start of the string or of a separated token —
    // the old global replace corrupted data like "ab0xcd".
    private clean(input: string): string {
        return input.replace(/(^|[\s:,-])0x/gi, '$1').replace(/[\s:\-,]/g, '');
    }

    confidence(input: string): number {
        if (!input) return 0;
        const cleanInput = this.clean(input);

        if (!/^[0-9A-Fa-f]+$/.test(cleanInput)) return 0;

        if (cleanInput.length % 2 !== 0) return 0;

        // Fewer than 2 bytes is too ambiguous to claim
        if (cleanInput.length < 4) return 0;

        if (/^0x/i.test(input.trim())) return 0.95;

        if (/[\s:\-]/.test(input)) return 0.9;

        return 0.6;
    }

    decode(input: string): string | null {
        try {
            const cleanInput = this.clean(input);

            if (cleanInput.length % 2 !== 0) return null;

            let result = '';
            for (let i = 0; i < cleanInput.length; i += 2) {
                const byte = parseInt(cleanInput.substring(i, i + 2), 16);
                result += String.fromCharCode(byte);
            }
            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from hexadecimal encoding — each pair of hex digits (0-9, A-F) represents one byte of data.';
    }
}
