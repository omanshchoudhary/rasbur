import { describe, it, expect, beforeAll } from 'vitest';
import {
    Base64Decoder,
    HexDecoder,
    BinaryDecoder,
    UrlDecoder,
    ROT13Decoder,
    decodeRegistry,
    registerDecoders,
    decodePipeline,
} from './index.js';

describe('Base64Decoder', () => {
    const d = new Base64Decoder();

    it('decodes a padded Base64 string', () => {
        expect(d.decode('SGVsbG8gV29ybGQ=')).toBe('Hello World');
    });

    it('scores padded input highly', () => {
        expect(d.confidence('SGVsbG8gV29ybGQ=')).toBeGreaterThanOrEqual(0.9);
    });

    it('returns 0 confidence for empty or non-Base64 input', () => {
        expect(d.confidence('')).toBe(0);
        expect(d.confidence('abc')).toBe(0); // length not divisible by 4
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
});
