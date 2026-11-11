```
                             __
   _____   ____ _    _____  / /_    __  __    _____
  / ___/  / __ `/   / ___/ / __ \  / / / /   / ___/
 / /     / /_/ /   (__  ) / /_/ / / /_/ /   / /
/_/      \__,_/   /____/  \_.___/ \__,_/   /_/
```

Rasbur identifies what an encoded string is, decodes it, and keeps unwrapping stacked
layers until nothing is left. You do not tell it the format.

Every decoder is scored twice: once on whether the input looks like its format, and again
on whether the decoded output looks like real data. That second score is what separates a
correct decode from one that merely looks valid, and it is why Rasbur returns nothing
instead of guessing when it cannot tell.

Free and open source under the MIT license.

## Packages

| Package                                                              | Version | Description                                   |
| -------------------------------------------------------------------- | ------- | --------------------------------------------- |
| [`@rasbur/decoders`](https://www.npmjs.com/package/@rasbur/decoders) | 0.1.3   | The decoding engine. No dependencies.         |
| [`@rasbur/mcp`](https://www.npmjs.com/package/@rasbur/mcp)           | 0.1.0   | MCP server giving an AI agent a real decoder. |

### Use it in code

```bash
npm install @rasbur/decoders
```

```ts
import { decodePipeline, registerDecoders } from '@rasbur/decoders';

registerDecoders();

decodePipeline.decode('NDg2NTZjNmM2ZjIwNTc2ZjcyNmM2NA==');
// Base64 -> 48656c6c6f20576f726c64 -> Hex -> "Hello World"
```

Full API, options and the recipe for registering your own decoder are in the
[package readme](packages/decoders#readme).

### Give it to an AI agent

Models decode short base64 reasonably well, then quietly corrupt long strings, lose track
across stacked layers, and almost never admit uncertainty. The MCP server hands them the
real thing.

```json
{
    "mcpServers": {
        "rasbur": {
            "command": "npx",
            "args": ["-y", "@rasbur/mcp"]
        }
    }
}
```

Works with any MCP client that supports stdio servers. Three tools: `decode`, `identify`
and `list_decoders`. Runs locally, no API key, no network calls. See the
[package readme](packages/mcp#readme).

## Supported encodings

Base64 (including base64url), Base32, Base58, Base85, Hex, Binary, Octal, URL, ASCII, Morse
Code, ROT13, Caesar Cipher, JWT, Unicode Escape, HTML Entity, Punycode,
Quoted-Printable, JSON Stringify, and hash identification for MD5, SHA-1, SHA-256,
SHA-512 and others.

## Web app

A free demo runs at [rasbur.vercel.app](https://rasbur.vercel.app). It is a full-stack
reference implementation that wraps the same engine in a workspace with live decoding over
a WebSocket, step-by-step pipeline inspection, saved history, expiring share links, a
character-level compare tool, Google and GitHub sign-in, and scoped API keys with per-key
rate limiting.

It runs on free-tier hosting, so the first request after a quiet spell can take up to a
minute, and saved data is kept on a best-effort basis. For anything you rely on, use the
packages. The demo also runs locally with `npm run dev`.

## Project structure

```
rasbur/
├── apps/
│   ├── api/                Express backend (REST and WebSocket)
│   └── web/                React and Vite frontend
├── packages/
│   ├── decoders/           Core decoding engine, published to npm
│   ├── mcp/                MCP server, published to npm
│   ├── shared/             Shared types and Zod schemas
│   ├── eslint-config/
│   └── typescript-config/
```

## Running locally

```bash
npm install
docker compose up -d                     # local Redis
cp apps/api/.env.example apps/api/.env   # fill in the required values
npm run dev
```

```bash
npm run build    # build all apps and packages
npm run test     # run the test suites
```

The packages need no setup. Only the web app and API require the environment file.

## HTTP API

Served by `apps/api` for the web app. Decoding works without an account under a daily
rate limit. Authenticate with a Bearer token or an `X-API-Key` header to raise it and to
reach endpoints that require an account. Interactive reference at `/docs`.

| Method          | Endpoint            | Auth     |
| --------------- | ------------------- | -------- |
| POST            | `/api/decode`       | Optional |
| POST            | `/api/identify`     | Optional |
| POST            | `/api/decode/batch` | Required |
| POST            | `/api/compare`      | Required |
| GET             | `/api/decoders`     | Public   |
| GET/POST/DELETE | `/api/history`      | Required |
| POST            | `/api/share`        | Required |
| GET             | `/api/share/:slug`  | Public   |
| POST            | `/api/keys`         | Required |
| GET/PATCH       | `/api/me`           | Required |

If you only need decoding in your own code, use `@rasbur/decoders` rather than this API.

## Tech stack

TypeScript, Turborepo, React 19, Vite, Tailwind CSS, Express, Socket.IO, MongoDB, Redis,
Zod, Vitest and Playwright.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started, and
[SECURITY.md](SECURITY.md) to report a vulnerability.

## License

MIT. Copyright Omansh Choudhary. See [LICENSE](LICENSE).
