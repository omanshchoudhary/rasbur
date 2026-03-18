import { Decoder } from '../base/Decoder.js';

export class HexDecoder extends Decoder {
    readonly name = 'Hex';

    confidence(input: string): number {
        if (!input) return 0;
        // Allows multiple format by cleaning them into proper hex format
        const cleanInput = input.replace(/0x/gi, '').replace(/[\s:\-,]/g, '');

        if (!/^[0-9A-Fa-f]+$/.test(cleanInput)) return 0;

        if (cleanInput.length % 2 !== 0) return 0;

        if (cleanInput.length < 2) return 0;

        if (/0x/i.test(input)) return 0.95;

        if (/[\s:\-]/.test(input)) return 0.9;

        return 0.6;
    }

    decode(input: string): string | null {
        try {
            const cleanInput = input.replace(/0x/gi, '').replace(/[\s:\-,]/g, '');

            if (cleanInput.length % 2 !== 0) return null;

            let result = '';
            for (let i = 0; i < cleanInput.length; i += 2) {
                const byte = parseInt(cleanInput.substring(i, i + 2), 16);
                result += String.fromCharCode(byte);
            }
            // If decoded output contains non-printable control characters, reject it.
            if (/[\x00-\x08\x0E-\x1F]/.test(result)) return null;

            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from hexadecimal encoding — each pair of hex digits (0-9, A-F) represents one byte of data.';
    }
}
