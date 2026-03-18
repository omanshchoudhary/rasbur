import { Decoder } from '../base/Decoder.js';

const HASH_TYPES: Record<number, string> = {
    8: 'CRC32',
    16: 'CRC16',
    32: 'MD5',
    40: 'SHA-1 / RIPEMD-160',
    56: 'SHA-224 / SHA-512/224',
    64: 'SHA-256 / SHA-512/256',
    96: 'SHA-384',
    128: 'SHA-512',
};

export class HashIdentifier extends Decoder {
    readonly name = 'Hash';

    confidence(input: string): number {
        if (!input) return 0;

        const cleanInput = input.replace(/[\s\-:]/g, '');

        if (!/^[a-fA-F0-9]+$/.test(cleanInput)) return 0;

        const len = cleanInput.length;

        if (HASH_TYPES[len]) {
            if (len === 32 || len === 64) return 0.95;
            return 0.9;
        }

        return 0;
    }

    decode(input: string): string | null {
        try {
            const cleanInput = input.replace(/[\s\-:]/g, '');
            const len = cleanInput.length;

            const hashType = HASH_TYPES[len];

            if (!hashType) return null;

            const bits = len * 4;

            return `Identified Hash:\nAlgorithm: ${hashType}\nBit Length: ${bits}\nHex Length: ${len} characters\n\nNote: Hashes are one-way. Decoding shows the identified algorithm, not the original input.`;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Identified cryptographic hash by length — CRC32 (8), MD5 (32), SHA-1 (40), SHA-224 (56), SHA-256 (64), SHA-384 (96), SHA-512 (128 hex chars).';
    }
}
