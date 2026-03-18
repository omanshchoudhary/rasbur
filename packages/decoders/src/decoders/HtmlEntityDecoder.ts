import { Decoder } from '../base/Decoder.js';

const NAMED_ENTITIES: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '\u00A9',
    '&reg;': '\u00AE',
    '&trade;': '\u2122',
    '&ndash;': '\u2013',
    '&mdash;': '\u2014',
    '&lsquo;': '\u2018',
    '&rsquo;': '\u2019',
    '&ldquo;': '\u201C',
    '&rdquo;': '\u201D',
    '&bull;': '\u2022',
    '&hellip;': '\u2026',
    '&eacute;': '\u00E9',
    '&egrave;': '\u00E8',
    '&agrave;': '\u00E0',
    '&auml;': '\u00E4',
};

export class HtmlEntityDecoder extends Decoder {
    readonly name = 'HTML Entity';

    confidence(input: string): number {
        if (!input) return 0;

        const namedCount = (input.match(/&[a-zA-Z]+;/g) || []).length;
        const decimalCount = (input.match(/&#\d+;/g) || []).length;
        const hexCount = (input.match(/&#x[0-9a-fA-F]+;/gi) || []).length;

        const total = namedCount + decimalCount + hexCount;

        if (total === 0) return 0;
        if (total >= 2) return 0.95;
        if (total === 1 && input.length < 20) return 0.9;
        return 0.6;
    }

    decode(input: string): string | null {
        try {
            let result = input;

            for (const [entity, char] of Object.entries(NAMED_ENTITIES)) {
                result = result.split(entity).join(char);
            }

            result = result.replace(/&#(\d+);/g, (_: string, code: string) => {
                const num = Number(code);
                if (Number.isSafeInteger(num) && num >= 1 && num <= 0x10ffff) {
                    return String.fromCodePoint(num);
                }
                return _;
            });

            result = result.replace(/&#x([0-9a-fA-F]+);/gi, (_: string, hex: string) => {
                const num = Number(`0x${hex}`);
                if (Number.isSafeInteger(num) && num >= 1 && num <= 0x10ffff) {
                    return String.fromCodePoint(num);
                }
                return _;
            });

            if (result === input) return null;
            return result;
        } catch {
            return null;
        }
    }

    explain(): string {
        return 'Decoded HTML entities — converts named (&amp;), decimal (&#65;), and hexadecimal (&#x41;) entities to their character equivalents.';
    }
}
