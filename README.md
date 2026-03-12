# Rasbur

An intelligent string decoder platform. Paste any encoded, encrypted, or obfuscated string — Rasbur auto-detects the encoding type, decodes it through a multi-layer pipeline, and provides step-by-step visual explanations.

Available as a **web app**, **REST API**, **CLI tool**, and **browser extension**.

## Tech Stack

TypeScript · Express.js · React · Vite · Tailwind CSS · MongoDB · Redis · Zod · Socket.io · Turborepo

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
