import { Decoder } from '../base/Decoder.js';

const BASE85_START = 33;

export class Base85Decoder extends Decoder {
    readonly name = 'Base85';

    confidence(input: string): number {
        if (!input) return 0;

        const trimmed = input.trim();
        const hasDelimiters = trimmed.startsWith('<~') && trimmed.endsWith('~>');
        const cleanInput = hasDelimiters ? trimmed.slice(2, -2) : trimmed;

        if (cleanInput.length === 0) return 0;

        let validCount = 0;
        for (const char of cleanInput) {
            const code = char.charCodeAt(0);
            if (char === 'z') {
                validCount++;
            } else if (code >= 33 && code <= 117) {
                validCount++;
            }
        }

        if (validCount !== cleanInput.length) return 0;

        if (hasDelimiters) return 0.95;

        // Raw Ascii85 without delimiters should usually look encoded,
        // not like a normal plain-English word.
        const hasSymbols = /[!#$%&()*+\-;<=>?@^_`{|}~]/.test(cleanInput);
        const hasDigit = /\d/.test(cleanInput);

        if (!hasSymbols && !hasDigit) {
            return 0;
        }

        if (cleanInput.length < 5) return 0;
        if (cleanInput.length % 5 === 0) return 0.75;

        return 0.45;
    }

    decode(input: string): string | null {
        try {
            const trimmed = input.trim();
            const hasDelimiters = trimmed.startsWith('<~') && trimmed.endsWith('~>');
            const cleanInput = hasDelimiters ? trimmed.slice(2, -2) : trimmed;

            if (cleanInput.length === 0) return null;

            const result: number[] = [];
            let i = 0;

            while (i < cleanInput.length) {
                // 'z' is a shortcut for four zero bytes
                if (cleanInput[i] === 'z') {
                    result.push(0, 0, 0, 0);
                    i++;
                    continue;
                }

                // Collect up to 5 characters for this group
                const groupChars: number[] = [];
                const groupStart = i;
                while (groupChars.length < 5 && i < cleanInput.length && cleanInput[i] !== 'z') {
                    groupChars.push(cleanInput.charCodeAt(i) - BASE85_START);
                    i++;
                }

                const isLastGroup = i >= cleanInput.length;
                const originalGroupLen = groupChars.length;

                // Pad incomplete group with 'u' (value 84)
                while (groupChars.length < 5) {
                    groupChars.push(84);
                }

                let value = 0;
                for (const digit of groupChars) {
                    value = value * 85 + digit;
                }

                const bytes = [
                    (value >>> 24) & 0xff,
                    (value >>> 16) & 0xff,
                    (value >>> 8) & 0xff,
                    value & 0xff,
                ];

                // For incomplete last group, only keep (originalGroupLen - 1) bytes
                const bytesToKeep = isLastGroup && originalGroupLen < 5 ? originalGroupLen - 1 : 4;

                for (let b = 0; b < bytesToKeep; b++) {
                    result.push(bytes[b]!);
                }
            }

            if (result.length === 0) return null;

            let finalResult = '';
            for (const byte of result) {
                finalResult += String.fromCharCode(byte);
            }

            return finalResult || null;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from Ascii85 (Base85) encoding — used in Adobe PostScript and PDF files. Each group of 5 characters represents 4 bytes of data.';
    }
}
