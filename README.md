# Rasbur

Rasbur detects and decodes encoded strings such as Base64, hex, JWT, Morse, and
ciphers, including multi-layer combinations. The auto-detection pipeline scores both
the input format and the decoded output, so it can tell a correct decode from output
that only looks valid. Every step is returned with a confidence score.

Rasbur is free, open source under the MIT license, and currently in open beta.

Live at https://rasbur.vercel.app

> Beta notice: Rasbur is in active testing. Saved history, API keys, and accounts may
> be reset during this period, so please do not store anything important yet.

## Features

- Auto-detection pipeline. Paste a payload and Rasbur identifies the encoding, decodes
  it, and unwraps stacked layers one at a time.
- Output-aware confidence. Each decoder is scored on both its input shape and the
  quality of the decoded output (English letter frequency, byte patterns, structure).
- Live decoding. Results stream over a WebSocket as you type, with a REST fallback.
- Web workspace. Decode, inspect each step, and copy or reuse the result.
- REST API. Call the same pipeline from your own code, authenticated with scoped keys.
- API keys and rate limits. Issue scoped keys and track usage per key.
- Shareable results. Turn any decode into an expiring public link that includes the
  full pipeline.
- Side-by-side compare. Decode two payloads and view a character-level diff of the output.
- History. Signed-in users can save and revisit past decodes.
- Accounts. Sign in with Google or GitHub.

## Supported decoders

Base64, Base32, Base58, Base85, Hex, Binary, URL, ASCII, Morse Code, ROT13, Caesar
Cipher, JWT, Unicode Escape, HTML Entity, Punycode, Quoted-Printable, JSON Stringify,
and Hash Identifier (MD5, SHA-1, SHA-256, SHA-512, and more).

## Tech stack

TypeScript, React 19, Vite, Tailwind CSS, Express, Socket.IO, MongoDB, Redis, Zod, and
Turborepo.

## Project structure

```
rasbur/
├── apps/
│   ├── api/                Express backend (REST and WebSocket)
│   └── web/                React and Vite frontend
├── packages/
│   ├── decoders/           Core decoding engine and pipeline
│   ├── shared/             Shared types and Zod schemas
│   ├── eslint-config/
│   └── typescript-config/
```

## API

The decode endpoints require authentication, either a Bearer token from a web session
or an `X-API-Key` header. A full interactive reference is available at `/docs`.

### POST /api/decode

Decodes an input string through the auto-detection pipeline.

Body:

```json
{
    "input": "SGVsbG8gV29ybGQ=",
    "options": {
        "maxDepth": 5,
        "strictMode": false
    }
}
```

Response:

```json
{
    "originalInput": "SGVsbG8gV29ybGQ=",
    "steps": [
        {
            "decoderName": "Base64",
            "confidence": 0.9,
            "input": "SGVsbG8gV29ybGQ=",
            "output": "Hello World",
            "explanation": "..."
        }
    ],
    "finalOutput": "Hello World"
}
```

### Other endpoints

- `POST /api/identify` ranks likely encodings without decoding.
- `POST /api/decode/batch` decodes multiple strings in one request.
- `GET /api/decoders` lists all registered decoders with descriptions.
- `GET /health` returns server health status.

## Getting started

```bash
npm install
cp apps/api/.env.example apps/api/.env   # fill in the required values
npm run dev
```

Other scripts:

```bash
npm run build    # build all apps and packages
npm run test     # run the test suites
npm run lint     # lint the workspace
```

## Roadmap

The following are planned and not yet built:

- File upload decoding. Decode the contents of uploaded files.
- Custom decoder plugins. Write and run your own decoders in a sandbox.
- Team workspaces. Shared history and keys for groups.
- CLI. Decode from the terminal.

## License

MIT. Copyright Omansh Choudhary. See [LICENSE](LICENSE).
