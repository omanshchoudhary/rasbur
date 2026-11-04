# @rasbur/decoders

Auto-detecting multi-layer string decoder. Give it an encoded string without saying what
the encoding is, and it identifies the format, decodes it, and keeps unwrapping stacked
layers until nothing is left to decode.

Every decoder is scored twice: once on whether the input looks like its format, and again
on whether the decoded output looks like real data. That second score is what lets it
tell a correct decode from one that merely looks valid, and return nothing when it is
not sure.

No dependencies. Runs in Node and the browser.

## Install

```bash
npm install @rasbur/decoders
```

## Usage

```ts
import { decodePipeline, registerDecoders } from '@rasbur/decoders';

registerDecoders();

const result = decodePipeline.decode('NDg2NTZjNmM2ZjIwNTc2ZjcyNmM2NA==');
```

`registerDecoders()` loads the built-in decoders. It is idempotent, so call it once at
startup.

The input above is hex wrapped in Base64. Both layers come back:

```json
{
    "originalInput": "NDg2NTZjNmM2ZjIwNTc2ZjcyNmM2NA==",
    "steps": [
        { "decoderName": "Base64", "confidence": 0.5, "output": "48656c6c6f20576f726c64" },
        { "decoderName": "Hex", "confidence": 0.6, "output": "Hello World" }
    ],
    "finalOutput": "Hello World"
}
```

Each step also carries `input` and an `explanation` string describing the encoding.

### Identifying without decoding

```ts
decodePipeline.identify('48656c6c6f');
// { input: '48656c6c6f', matches: [ { name: 'Hex', confidence: 0.6, description: '...' } ] }
```

Candidates whose decoded output fails the quality check are left out, so an AWS key id
like `AKIAIOSFODNN7EXAMPLE` returns no matches rather than claiming to be Base64.

### Options

```ts
decodePipeline.decode(input, {
    maxDepth: 5, // layers to unwrap, default 5
    strictMode: false, // stop when the best candidate scores below 0.7
    forceDecoder: 'Hex', // skip detection and run one decoder by name
});
```

A single call is also capped at two seconds of wall-clock time.

### Isolating decoders

Pass a `DecodeRegistry` to create a pipeline that only uses the decoders registered in that instance. Pipelines without an argument continue to use the shared registry.

```ts
import { DecodePipeline, DecodeRegistry, HexDecoder } from '@rasbur/decoders';

const registry = new DecodeRegistry();
registry.register(new HexDecoder());
const pipeline = new DecodePipeline(registry);

pipeline.decode('48656c6c6f').finalOutput; // 'Hello'
```

## Writing your own decoder

Extend `Decoder` and register it. It then takes part in detection like any built-in.

```ts
import { Decoder, decodeRegistry } from '@rasbur/decoders';

class CompanyTokenDecoder extends Decoder {
    readonly name = 'CompanyToken';

    confidence(input: string): number {
        return input.startsWith('ct_') ? 0.9 : 0;
    }

    decode(input: string): string | null {
        return input.slice(3);
    }

    explain(): string {
        return 'Decoded from an internal company token.';
    }
}

decodeRegistry.register(new CompanyTokenDecoder());
```

`confidence` returns 0 to 1 for how much the input looks like your format. `decode`
returns the decoded string, or `null` if it cannot.

## Built-in decoders

Base64 (including base64url), Base32, Base58, Base85, Hex, Binary, URL, ASCII, Morse
Code, ROT13, Caesar Cipher, JWT, Unicode Escape, HTML Entity, Punycode,
Quoted-Printable, JSON Stringify, and a hash identifier for MD5, SHA-1, SHA-256 and
SHA-512.

## Limitations

Output scoring is tuned for ASCII and English text, so decoded output in other scripts
scores low and may be rejected. There is no entropy-based detection, and Caesar is the
only brute-forced cipher.

## License

MIT. Part of [Rasbur](https://github.com/omanshchoudhary/rasbur).
