// Shared output-quality scoring.
// Decoders judge whether the INPUT looks like their format; the pipeline uses
// these helpers to judge whether the decoded OUTPUT looks like real data.

export const ENGLISH_FREQ: Record<string, number> = {
    e: 12.7,
    t: 9.1,
    a: 8.2,
    o: 7.5,
    i: 7.0,
    n: 6.9,
    s: 6.3,
    h: 6.1,
    r: 6.0,
    d: 4.3,
    l: 4.0,
    c: 2.8,
    u: 2.8,
    m: 2.4,
    w: 2.4,
    f: 2.2,
    g: 2.0,
    y: 2.0,
    p: 1.9,
    b: 1.5,
    v: 1.0,
    k: 0.8,
    j: 0.15,
    x: 0.15,
    q: 0.1,
    z: 0.07,
};

// Control chars (except \t \n \r), DEL, and the U+FFFD replacement char that
// Buffer.toString('utf-8') emits for invalid byte sequences.
const BAD_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F�]/;

// Letters covering ~75% of typical English text. Their share among the
// letters of a string is a robust English signal even for short strings,
// where chi-squared letter frequency becomes too noisy.
const COMMON_LETTERS = new Set(['e', 't', 'a', 'o', 'i', 'n', 's', 'r', 'h', 'l', 'd']);

// The most frequent English letter pairs. Bigrams discriminate real words
// from statistically-plausible letter soup far better than single-letter
// frequency on short strings.
const COMMON_BIGRAMS = new Set([
    'th',
    'he',
    'in',
    'er',
    'an',
    're',
    'on',
    'at',
    'en',
    'nd',
    'ti',
    'es',
    'or',
    'te',
    'of',
    'ed',
    'is',
    'it',
    'al',
    'ar',
    'st',
    'to',
    'nt',
    'ng',
    'se',
    'ha',
    'as',
    'ou',
    'io',
    'le',
    've',
    'co',
    'me',
    'de',
    'hi',
    'ri',
    'ro',
    'ic',
    'ne',
    'ea',
    'ra',
    'ce',
    'li',
    'ch',
    'll',
    'be',
    'ma',
    'si',
    'om',
    'ur',
    'el',
    'lo',
    'ld',
    'ow',
    'wo',
    'no',
    'us',
    'wh',
    'ho',
    'ut',
]);

export function printableRatio(text: string): number {
    if (!text) return 0;

    let bad = 0;
    for (const char of text) {
        if (BAD_CHAR_REGEX.test(char)) bad++;
    }
    return 1 - bad / [...text].length;
}

function asciiRatio(text: string): number {
    if (!text) return 0;

    const chars = [...text];
    let ascii = 0;
    for (const char of chars) {
        const code = char.codePointAt(0)!;
        if ((code >= 32 && code < 127) || code === 9 || code === 10 || code === 13) {
            ascii++;
        }
    }
    return ascii / chars.length;
}

// Share of a string's letters that belong to the high-frequency English set.
// English prose sits around 0.7–0.8; uniform random letters around 0.4.
export function commonLetterRatio(text: string): number {
    const letters = text.toLowerCase().replace(/[^a-z]/g, '');
    if (letters.length === 0) return 0;

    let common = 0;
    for (const letter of letters) {
        if (COMMON_LETTERS.has(letter)) common++;
    }
    return common / letters.length;
}

// Share of within-word letter pairs that are common English bigrams.
// English prose scores ~0.45–0.7; rotated gibberish ~0.05–0.2.
export function bigramCommonRatio(text: string): number {
    const words = text.toLowerCase().match(/[a-z]+/g) || [];

    let total = 0;
    let common = 0;
    for (const word of words) {
        for (let i = 0; i < word.length - 1; i++) {
            total++;
            if (COMMON_BIGRAMS.has(word.slice(i, i + 2))) common++;
        }
    }

    return total > 0 ? common / total : 0;
}

// Share of a string's letters that are rare in English (j, q, x, z).
// Real English stays under ~2%; letter-substitution gibberish spikes this.
export function rareLetterRatio(text: string): number {
    const letters = text.toLowerCase().replace(/[^a-z]/g, '');
    if (letters.length === 0) return 0;

    const rare = (text.toLowerCase().match(/[jqxz]/g) || []).length;
    return rare / letters.length;
}

export function englishLikeness(text: string): number {
    const letters = text.toLowerCase().replace(/[^a-z]/g, '');
    // Too few letters to judge — stay neutral so digits/JSON aren't punished
    if (letters.length < 4) return 0.5;

    return Math.max(0, Math.min(1, (commonLetterRatio(text) - 0.25) / 0.5));
}

// 0..1 score for "does this look like real decoded data?"
// Control/replacement chars are a hard gate; ASCII share and English-letter
// distribution are soft signals. Non-English unicode prose scores low — an
// accepted tradeoff, since decode targets here are overwhelmingly ASCII.
export function plaintextScore(text: string): number {
    if (!text) return 0;

    const printable = printableRatio(text);
    if (printable < 0.85) return printable * 0.1;

    return 0.55 * asciiRatio(text) + 0.45 * englishLikeness(text);
}
