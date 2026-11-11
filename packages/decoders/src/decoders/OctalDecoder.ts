import { Decoder } from '../base/Decoder.js';

const isPrintableAscii = (value: number): boolean =>
    (value >= 32 && value <= 126) || value === 9 || value === 10 || value === 13;

const parseOctalBytes = (input: string): number[] | null => {
    const groups = input.trim().split(/[\s,]+/);
    if (groups.length < 2 || groups.some((group) => !/^[0-7]{3}$/.test(group))) return null;

    const bytes = groups.map((group) => parseInt(group, 8));
    return bytes.every(isPrintableAscii) ? bytes : null;
};

export class OctalDecoder extends Decoder {
    readonly name = 'Octal';

    confidence(input: string): number {
        const bytes = parseOctalBytes(input);
        if (!bytes) return 0;

        const decimalValues = input
            .trim()
            .split(/[\s,]+/)
            .map(Number);
        if (decimalValues.every(isPrintableAscii)) return 0;

        const letterCount = bytes.filter(
            (value) => (value >= 65 && value <= 90) || (value >= 97 && value <= 122)
        ).length;
        return letterCount / bytes.length > 0.5 ? 0.95 : 0.85;
    }

    decode(input: string): string | null {
        const bytes = parseOctalBytes(input);
        return bytes ? bytes.map((byte) => String.fromCharCode(byte)).join('') : null;
    }

    explain(): string {
        return 'Decoded from space-separated octal ASCII bytes, where each three-digit octal group represents one character.';
    }
}
