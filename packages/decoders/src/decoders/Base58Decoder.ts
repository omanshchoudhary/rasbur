import { Decoder } from '../base/Decoder.js';

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export class Base58Decoder extends Decoder {
    readonly name = 'Base58';

    confidence(input: string): number {
        const cleanInput = input.replace(/\s+/g, '');
        if (cleanInput.length < 2) return 0;

        // Base58 excludes: 0, O, I, l
        const invalidChars = /[0OlI]/;
        if (invalidChars.test(cleanInput)) return 0;

        // Must only use Base58 characters
        for (const char of cleanInput) {
            if (!BASE58_ALPHABET.includes(char)) return 0;
        }
        if (cleanInput.length >= 26 && cleanInput.length <= 35) return 0.95;
        return 0.7;
    }

    decode(input: string): string | null {
        try {
            const cleanInput = input.replace(/\s+/g, '');

            let num = BigInt(0);
            for (const char of cleanInput) {
                const index = BASE58_ALPHABET.indexOf(char);
                if (index === -1) return null;
                num = num * BigInt(58) + BigInt(index);
            }

            let result = '';
            while (num > 0) {
                const remainder = Number(num % BigInt(256));
                result = String.fromCharCode(remainder) + result;
                num = num / BigInt(256);
            }
            // Handle leading zeros (they stay as single 0 byte)
            for (const char of cleanInput) {
                if (char === BASE58_ALPHABET[0]) {
                    result = '\x00' + result;
                } else {
                    break;
                }
            }
            if (!result) return null;
            return result;
        } catch {
            return null;
        }
    }
    explain(): string {
        return 'Decoded from Base58 encoding — used in Bitcoin/IPFS addresses. Uses 58 characters (excludes 0, O, I, l to avoid confusion).';
    }
}
