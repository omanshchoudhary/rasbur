import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
    Base64Decoder,
    HexDecoder,
    BinaryDecoder,
    UrlDecoder,
    ROT13Decoder,
    CaesarCipherDecoder,
    decodeRegistry,
    registerDecoders,
    decodePipeline,
    plaintextScore,
} from './index.js';
import { decodeBase64, bytesToUtf8, decodeBase64Text } from './utils/base64.js';

describe('Base64Decoder', () => {
    const d = new Base64Decoder();

    it('decodes a padded Base64 string', () => {
        expect(d.decode('SGVsbG8gV29ybGQ=')).toBe('Hello World');
    });

    it('scores padded input highly', () => {
        expect(d.confidence('SGVsbG8gV29ybGQ=')).toBeGreaterThanOrEqual(0.9);
    });

    it('decodes unpadded Base64url input', () => {
        expect(d.confidence('eyJzdWIiOiIxMjM0NTY3ODkwIn0')).toBeGreaterThan(0);
        expect(d.decode('eyJzdWIiOiIxMjM0NTY3ODkwIn0')).toBe('{"sub":"1234567890"}');
    });

    it('returns 0 confidence for empty or non-Base64 input', () => {
        expect(d.confidence('')).toBe(0);
        expect(d.confidence('abc')).toBe(0); // length not divisible by 4
        expect(d.confidence('abcde')).toBe(0); // impossible Base64 length
    });
});

describe('HexDecoder', () => {
    const d = new HexDecoder();

    it('decodes hex to text', () => {
        expect(d.decode('48656c6c6f')).toBe('Hello');
    });

    it('scores 0x-prefixed input highest', () => {
        expect(d.confidence('0x48656c6c6f')).toBe(0.95);
    });

    it('rejects odd-length hex', () => {
        expect(d.confidence('abc')).toBe(0);
    });
});

describe('BinaryDecoder', () => {
    const d = new BinaryDecoder();

    it('decodes space-separated binary octets', () => {
        expect(d.decode('01001000 01101001')).toBe('Hi');
    });

    it('scores clean octet groups highly', () => {
        expect(d.confidence('01001000 01101001')).toBe(0.95);
    });

    it('returns 0 for non-binary input', () => {
        expect(d.confidence('hello')).toBe(0);
    });
});

describe('UrlDecoder', () => {
    const d = new UrlDecoder();

    it('decodes percent-encoded text', () => {
        expect(d.decode('Hello%20World')).toBe('Hello World');
    });

    it('returns null when nothing changes', () => {
        expect(d.decode('plain-text')).toBeNull();
    });

    it('returns 0 confidence without percent sequences', () => {
        expect(d.confidence('plain text')).toBe(0);
    });
});

describe('ROT13Decoder', () => {
    const d = new ROT13Decoder();

    it('decodes a ROT13 string back to plaintext', () => {
        expect(d.decode('Uryyb')).toBe('Hello');
    });

    it('returns null when there are no letters to rotate', () => {
        expect(d.decode('12345')).toBeNull();
    });
});

describe('decodeRegistry + registerDecoders', () => {
    beforeAll(() => registerDecoders());

    it('registers all 18 decoders (idempotently)', () => {
        registerDecoders(); // second call should be a no-op
        expect(decodeRegistry.getAll()).toHaveLength(18);
    });

    it('looks up a decoder by name', () => {
        expect(decodeRegistry.getByName('Base64')).toBeDefined();
        expect(decodeRegistry.getByName('Nonexistent')).toBeUndefined();
    });

    it('every decoder exposes a non-empty explanation', () => {
        for (const decoder of decodeRegistry.getAll()) {
            expect(decoder.explain().length).toBeGreaterThan(0);
        }
    });
});

describe('DecodePipeline', () => {
    beforeAll(() => registerDecoders());

    it('auto-detects and decodes a single layer', () => {
        const result = decodePipeline.decode('SGVsbG8gV29ybGQ=');
        expect(result.finalOutput).toBe('Hello World');
        expect(result.steps.length).toBeGreaterThanOrEqual(1);
        expect(result.steps[0]!.decoderName).toBe('Base64');
    });

    it('returns the original input when nothing decodes', () => {
        const result = decodePipeline.decode('');
        expect(result.steps).toHaveLength(0);
        expect(result.finalOutput).toBe('');
    });

    it('honors forceDecoder', () => {
        const result = decodePipeline.decode('48656c6c6f', { forceDecoder: 'Hex' });
        expect(result.steps[0]!.decoderName).toBe('Hex');
        expect(result.finalOutput).toBe('Hello');
    });

    it('identify ranks candidate decoders by confidence', () => {
        const result = decodePipeline.identify('SGVsbG8gV29ybGQ=');
        expect(result.matches.length).toBeGreaterThan(0);
        expect(result.matches[0]!.confidence).toBeGreaterThan(0);
        // sorted descending
        expect(result.matches[0]!.confidence).toBeGreaterThanOrEqual(
            result.matches[result.matches.length - 1]!.confidence
        );
    });

    it('does not identify Base64-shaped garbage as a confident match', () => {
        const result = decodePipeline.identify('AKIAIOSFODNN7EXAMPLE');
        expect(result.matches).toEqual([]);
    });

    it('does not decode Base64-shaped garbage', () => {
        const result = decodePipeline.decode('AKIAIOSFODNN7EXAMPLE');
        expect(result.steps).toEqual([]);
        expect(result.finalOutput).toBe('AKIAIOSFODNN7EXAMPLE');
    });

    it.each(['just some words', 'The quick brown fox', 'hello world'])(
        'leaves plain English untouched: %s',
        (text) => {
            expect(decodePipeline.decode(text).steps).toEqual([]);
            expect(decodePipeline.identify(text).matches).toEqual([]);
        }
    );
});

describe('plaintextScore control characters', () => {
    it('rejects output containing a control character', () => {
        expect(plaintextScore('hello\u0010world')).toBe(0);
    });

    it('still accepts tabs and newlines', () => {
        expect(plaintextScore('line one\nline two\ttabbed')).toBeGreaterThan(0.5);
    });
});

describe('plaintextScore', () => {
    it('rates real text highly', () => {
        expect(plaintextScore('Hello World')).toBeGreaterThan(0.8);
    });

    it('rates JSON as acceptable structured output', () => {
        expect(plaintextScore('{"key":"value"}')).toBeGreaterThan(0.6);
    });

    it('rejects high-byte mojibake', () => {
        expect(plaintextScore('ÞÊÞ')).toBeLessThan(0.3);
    });

    it('rejects replacement-char garbage', () => {
        expect(plaintextScore('��-')).toBeLessThan(0.2);
    });

    it('rejects control characters', () => {
        expect(plaintextScore('i\x01\x02\x1d')).toBeLessThan(0.2);
    });

    it('returns 0 for empty input', () => {
        expect(plaintextScore('')).toBe(0);
    });
});

describe('base64 helper', () => {
    it('decodes padded and unpadded base64 to the same bytes', () => {
        expect([...decodeBase64('SGVsbG8gV29ybGQ=')]).toEqual([...Buffer.from('Hello World')]);
        expect([...decodeBase64('SGVsbG8gV29ybGQ')]).toEqual([...Buffer.from('Hello World')]);
    });

    it('decodes base64url characters', () => {
        expect([...decodeBase64('-_-_')]).toEqual([...Buffer.from('-_-_', 'base64')]);
        expect([...decodeBase64('a-g_')]).toEqual([...Buffer.from('a-g_', 'base64')]);
    });

    it('decodes JWT header and payload segments', () => {
        expect(decodeBase64Text('eyJhbGciOiJIUzI1NiJ9')).toBe('{"alg":"HS256"}');
        expect(decodeBase64Text('eyJzdWIiOiJyYXNidXIifQ')).toBe('{"sub":"rasbur"}');
    });

    it('skips invalid characters instead of throwing', () => {
        expect(decodeBase64Text('SGV!s!bG8=')).toBe('Hello');
        expect(decodeBase64('!!!')).toHaveLength(0);
    });

    it('handles missing padding of every remainder length', () => {
        expect([...decodeBase64('QQ')]).toEqual([...Buffer.from('QQ', 'base64')]);
        expect([...decodeBase64('QUJDR')]).toEqual([...Buffer.from('QUJDR', 'base64')]);
        expect([...decodeBase64('QUJDRE')]).toEqual([...Buffer.from('QUJDRE', 'base64')]);
        expect([...decodeBase64('QUJDREF')]).toEqual([...Buffer.from('QUJDREF', 'base64')]);
        expect([...decodeBase64('QUJDREFU')]).toEqual([...Buffer.from('QUJDREFU', 'base64')]);
        expect([...decodeBase64('QUJDREFUR')]).toEqual([...Buffer.from('QUJDREFUR', 'base64')]);
        expect([...decodeBase64('A')]).toEqual([]);
        expect(decodeBase64('')).toHaveLength(0);
    });

    it('stops decoding at the first padding character', () => {
        expect([...decodeBase64('QQ==QQ==')]).toEqual([65]);
    });

    it('converts bytes to utf-8 with replacement chars for invalid sequences', () => {
        expect(bytesToUtf8(Uint8Array.from([200]))).toBe('\uFFFD');
        expect(bytesToUtf8(Uint8Array.from([72, 255, 73]))).toBe('H\uFFFDI');
        expect(bytesToUtf8(Uint8Array.from([104, 105]))).toBe('hi');
    });

    it('keeps a utf-8 byte order mark in the output', () => {
        expect(bytesToUtf8(Uint8Array.from([0xef, 0xbb, 0xbf, 0x7a]))).toBe('\uFEFFz');
    });
});

describe('CaesarCipherDecoder', () => {
    const d = new CaesarCipherDecoder();

    it('decodes shifted English back to plaintext', () => {
        expect(d.decode('Khoor Zruog')).toContain('Hello World');
    });

    it('claims shifted English with confidence', () => {
        expect(d.confidence('Khoor Zruog')).toBeGreaterThanOrEqual(0.65);
    });

    it('analyses the same input once across confidence() and decode()', () => {
        const fresh = new CaesarCipherDecoder();
        const spy = vi.spyOn(
            fresh as unknown as { bestShift(input: string): unknown },
            'bestShift'
        );
        expect(fresh.confidence('Khoor Zruog')).toBeGreaterThanOrEqual(0.65);
        expect(fresh.decode('Khoor Zruog')).toContain('Hello World');
        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });

    it('leaves plain English alone', () => {
        expect(d.confidence('Hello World')).toBe(0);
        expect(d.decode('Hello World')).toBeNull();
    });

    it('rejects gibberish where no shift helps', () => {
        expect(d.confidence('qzkx vbnm jqzx')).toBe(0);
    });
});

describe('HexDecoder 0x handling', () => {
    const d = new HexDecoder();

    it('strips per-byte 0x prefixes', () => {
        expect(d.decode('0x48 0x65 0x6c 0x6c 0x6f')).toBe('Hello');
    });

    it('does not strip 0x from the middle of data', () => {
        // "ab0xcd" is not valid hex once 0x stays in place
        expect(d.confidence('ab0xcd')).toBe(0);
    });
});

describe('DecodePipeline robustness', () => {
    beforeAll(() => registerDecoders());

    it('leaves ordinary words alone instead of emitting garbage', () => {
        // each of these passes some decoder's input-shape check
        // ("test" looks like Base64, "decade"/"cafe" look like hex)
        for (const word of ['test', 'decade', 'cafe', 'added']) {
            const result = decodePipeline.decode(word);
            expect(result.steps).toHaveLength(0);
            expect(result.finalOutput).toBe(word);
        }
    });

    it('decodes a Base64 -> Hex layered payload', () => {
        const layered = Buffer.from('48656c6c6f20526173627572').toString('base64');
        const result = decodePipeline.decode(layered);
        expect(result.finalOutput).toBe('Hello Rasbur');
        expect(result.steps.map((s) => s.decoderName)).toEqual(['Base64', 'Hex']);
    });

    it('decodes deeply nested Base64 within maxDepth', () => {
        let nested = 'Hello World';
        for (let i = 0; i < 4; i++) {
            nested = Buffer.from(nested).toString('base64');
        }
        const result = decodePipeline.decode(nested);
        expect(result.finalOutput).toBe('Hello World');
        expect(result.steps).toHaveLength(4);
    });

    it('respects the maxDepth option', () => {
        let nested = 'Hello World';
        for (let i = 0; i < 4; i++) {
            nested = Buffer.from(nested).toString('base64');
        }
        const result = decodePipeline.decode(nested, { maxDepth: 2 });
        expect(result.steps).toHaveLength(2);
    });

    it('reports quality-weighted confidence per step', () => {
        const result = decodePipeline.decode('SGVsbG8gV29ybGQ=');
        expect(result.steps[0]!.confidence).toBeGreaterThan(0.7);
        expect(result.steps[0]!.confidence).toBeLessThanOrEqual(1);
    });
});
