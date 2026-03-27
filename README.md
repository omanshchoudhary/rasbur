# Rasbur

An intelligent string decoder platform. Paste any encoded, encrypted, or obfuscated string — Rasbur auto-detects the encoding type, decodes it through a multi-layer pipeline, and provides step-by-step visual explanations.

Available as a **web app**, **REST API**, and **CLI tool**.

## Tech Stack

TypeScript · Express.js · React · Vite · Tailwind CSS · MongoDB · Zod · Turborepo

## Project Structure
```
rasbur/
├── apps/
│   ├── api/          # Express.js backend
│   ├── web/          # React + Vite frontend
│   └── cli/          # CLI tool
├── packages/
│   ├── decoders/     # Core decoding engine
│   ├── shared/       # Shared types & Zod schemas
│   ├── eslint-config/
│   └── typescript-config/
```

## Supported Decoders

Base64 · Base32 · Base58 · Base85 · Hex · Binary · URL · ASCII · Morse Code · ROT13 · Caesar Cipher · JWT · Unicode Escape · HTML Entity · Punycode · Quoted-Printable · JSON Stringify · Hash Identifier (MD5, SHA-1, SHA-256, SHA-512, etc.)

## API

### `POST /api/decode`
Decodes an input string through the auto-detection pipeline.

**Body**
```json
{
  "input": "SGVsbG8gV29ybGQ=",
  "options": {
    "maxDepth": 5,
    "strictMode": false
  }
}
```

**Response**
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

### `GET /api/decoders`
Returns all registered decoders with their names and descriptions.

### `GET /health`
Returns server health status.

## Getting Started
```bash
npm install
cp apps/api/.env.example apps/api/.env  # add MONGODB_URI
npm run dev
```