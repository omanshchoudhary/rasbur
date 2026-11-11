import { Decoder } from '../base/Decoder.js';
import { englishLikeness } from '../utils/textScore.js';

const PRINTABLE_ASCII = /^[\x20-\x7E]+$/;

export class ROT47Decoder extends Decoder {
    readonly name = 'ROT47';

    confidence(input: string): number {
        if (!PRINTABLE_ASCII.test(input) || /^[\da-f]+$/i.test(input)) return 0;

        const decoded = this.rotate(input);
        const inputLetters = input.match(/[a-z]/gi)?.length ?? 0;
        const decodedLetters = decoded.match(/[a-z]/gi)?.length ?? 0;

        if (decodedLetters / input.length < 0.6 || decodedLetters <= inputLetters) return 0;
        return englishLikeness(decoded) >= 0.8 ? 0.85 : 0;
    }

    decode(input: string): string | null {
        if (!PRINTABLE_ASCII.test(input)) return null;

        const decoded = this.rotate(input);
        return decoded === input ? null : decoded;
    }

    explain(): string {
        return 'Decoded from ROT47, which rotates every printable ASCII character except space by 47 positions.';
    }

    private rotate(input: string): string {
        return input.replace(/[!-~]/g, (char) => {
            const code = char.charCodeAt(0);
            return String.fromCharCode(((code - 33 + 47) % 94) + 33);
        });
    }
}
