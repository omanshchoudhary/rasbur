import { Decoder } from '../base/Decoder.js';

const MORSE_TO_CHAR: Record<string, string> = {
    '.-': 'A',
    '-...': 'B',
    '-.-.': 'C',
    '-..': 'D',
    '.': 'E',
    '..-.': 'F',
    '--.': 'G',
    '....': 'H',
    '..': 'I',
    '.---': 'J',
    '-.-': 'K',
    '.-..': 'L',
    '--': 'M',
    '-.': 'N',
    '---': 'O',
    '.--.': 'P',
    '--.-': 'Q',
    '.-.': 'R',
    '...': 'S',
    '-': 'T',
    '..-': 'U',
    '...-': 'V',
    '.--': 'W',
    '-..-': 'X',
    '-.--': 'Y',
    '--..': 'Z',
    '-----': '0',
    '.----': '1',
    '..---': '2',
    '...--': '3',
    '....-': '4',
    '.....': '5',
    '-....': '6',
    '--...': '7',
    '---..': '8',
    '----.': '9',
};

export class MorseDecoder extends Decoder {
    readonly name = 'Morse';

    confidence(input: string): number {
        if (!input) return 0;

        if (!/^[\.\-\s/]+$/.test(input)) return 0;

        if (!input.includes('.') || !input.includes('-')) return 0;

        const words = input.trim().split(/\s*\/\s*|\s{3,}/);
        let validLetters = 0;
        let totalLetters = 0;

        for (const word of words) {
            const letters = word.trim().split(/\s+/);
            for (const letter of letters) {
                if (!letter) continue;
                totalLetters++;
                if (MORSE_TO_CHAR[letter]) {
                    validLetters++;
                }
            }
        }

        if (totalLetters === 0) return 0;

        const ratio = validLetters / totalLetters;
        if (ratio === 1) return 0.95;
        if (ratio > 0.8) return 0.7;
        return 0;
    }

    decode(input: string): string | null {
        try {
            const words = input.trim().split(/\s*\/\s*|\s{3,}/);
            const decodedWords: string[] = [];

            for (const word of words) {
                const letters = word.trim().split(/\s+/);
                let decodedWord = '';

                for (const letter of letters) {
                    if (!letter) continue;
                    const char = MORSE_TO_CHAR[letter];
                    if (!char) return null;
                    decodedWord += char;
                }

                if (decodedWord) {
                    decodedWords.push(decodedWord);
                }
            }

            if (decodedWords.length === 0) return null;

            return decodedWords.join(' ');
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded from Morse code — a system representing letters and numbers as sequences of dots (.) and dashes (-), with spaces between letters and / between words.';
    }
}
