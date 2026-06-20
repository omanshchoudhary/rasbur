import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Terminal, KeyRound, ShieldCheck, ExternalLink, Copy, Check, Zap } from 'lucide-react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
const EXPLORER_URL = `${API_BASE_URL || 'http://localhost:3001'}/docs`;
const DISPLAY_BASE_URL = API_BASE_URL || 'http://localhost:3001';

type Endpoint = {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    description: string;
    auth: 'public' | 'auth';
};

const ENDPOINT_GROUPS: { title: string; endpoints: Endpoint[] }[] = [
    {
        title: 'Decoding',
        endpoints: [
            {
                method: 'POST',
                path: '/api/decode',
                description: 'Decode a string through the auto-detection pipeline',
                auth: 'auth',
            },
            {
                method: 'POST',
                path: '/api/identify',
                description: 'Identify likely encodings without decoding',
                auth: 'auth',
            },
            {
                method: 'POST',
                path: '/api/decode/batch',
                description: 'Decode up to 50 strings in one request',
                auth: 'auth',
            },
            {
                method: 'GET',
                path: '/api/decoders',
                description: 'List all available decoders',
                auth: 'public',
            },
        ],
    },
    {
        title: 'API Keys',
        endpoints: [
            {
                method: 'GET',
                path: '/api/keys',
                description: "List your account's API keys",
                auth: 'auth',
            },
            {
                method: 'POST',
                path: '/api/keys',
                description: 'Create a new API key',
                auth: 'auth',
            },
            {
                method: 'PATCH',
                path: '/api/keys/:id',
                description: 'Update a key name or permissions',
                auth: 'auth',
            },
            {
                method: 'DELETE',
                path: '/api/keys/:id',
                description: 'Revoke an API key',
                auth: 'auth',
            },
            {
                method: 'GET',
                path: '/api/keys/:id/usage',
                description: 'Get usage stats for a key',
                auth: 'auth',
            },
        ],
    },
    {
        title: 'History & Sharing',
        endpoints: [
            {
                method: 'GET',
                path: '/api/history',
                description: 'List your decode history',
                auth: 'auth',
            },
            {
                method: 'POST',
                path: '/api/share',
                description: 'Create a shareable decode link',
                auth: 'auth',
            },
            {
                method: 'POST',
                path: '/api/compare',
                description: 'Compare two encoded strings',
                auth: 'auth',
            },
        ],
    },
];

const METHOD_COLORS: Record<Endpoint['method'], string> = {
    GET: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400',
    POST: 'bg-blue-950/40 border-blue-500/30 text-blue-400',
    PATCH: 'bg-amber-950/40 border-amber-500/30 text-amber-400',
    DELETE: 'bg-red-950/40 border-red-500/30 text-red-400',
};

const CURL_EXAMPLE = `curl -X POST ${DISPLAY_BASE_URL}/api/decode \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: rasbur_sk_your_key_here" \\
  -d '{"input": "SGVsbG8gV29ybGQ="}'`;

export default function ApiDocsPage() {
    const [copied, setCopied] = useState(false);

    async function copyCurl() {
        try {
            await navigator.clipboard.writeText(CURL_EXAMPLE);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard unavailable */
        }
    }

    return (
        <main className="decode-page max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <section className="decode-hero mb-8">
                <p className="decode-kicker">Developer Reference</p>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white">API Documentation</h1>
                        <p className="decode-subtitle text-neutral-400 text-sm mt-2">
                            Integrate Rasbur's decoding engine directly into your tools, scripts,
                            and pipelines.
                        </p>
                    </div>
                    <a
                        href={EXPLORER_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-white text-black! rounded-lg text-sm font-bold transition-all duration-200 hover:bg-neutral-200 flex items-center gap-2"
                    >
                        <Zap size={16} />
                        Open Interactive Explorer
                        <ExternalLink size={14} />
                    </a>
                </div>
            </section>

            {/* Base URL */}
            <section className="glass-surface rounded-2xl border border-white/5 bg-neutral-950/40 p-6 mb-6">
                <div className="flex items-center gap-2 mb-3 text-neutral-300">
                    <Terminal size={16} />
                    <h2 className="font-bold text-sm">Base URL</h2>
                </div>
                <code className="text-sm font-mono text-emerald-300 bg-neutral-950 border border-white/10 rounded-xl px-4 py-2.5 block">
                    {DISPLAY_BASE_URL}
                </code>
            </section>

            {/* Authentication */}
            <section className="glass-surface rounded-2xl border border-white/5 bg-neutral-950/40 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4 text-neutral-300">
                    <ShieldCheck size={16} />
                    <h2 className="font-bold text-sm">Authentication</h2>
                </div>
                <p className="text-sm text-neutral-400 mb-4">
                    Requests can be authenticated two ways. Browser sessions use a JWT bearer token;
                    programmatic access uses an API key.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-neutral-950/60 border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <KeyRound size={14} className="text-blue-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                                API Key
                            </span>
                        </div>
                        <code className="text-xs font-mono text-neutral-400 break-all">
                            X-API-Key: rasbur_sk_…
                        </code>
                        <p className="text-xs text-neutral-500 mt-2">
                            Recommended for scripts & servers.{' '}
                            <Link to="/settings/api-keys" className="text-blue-400 hover:underline">
                                Manage keys →
                            </Link>
                        </p>
                    </div>
                    <div className="bg-neutral-950/60 border border-white/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                                Bearer (JWT)
                            </span>
                        </div>
                        <code className="text-xs font-mono text-neutral-400 break-all">
                            Authorization: Bearer &lt;token&gt;
                        </code>
                        <p className="text-xs text-neutral-500 mt-2">
                            Issued automatically on web sign-in.
                        </p>
                    </div>
                </div>
            </section>

            {/* Quickstart */}
            <section className="glass-surface rounded-2xl border border-white/5 bg-neutral-950/40 p-6 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-neutral-300">
                        <Terminal size={16} />
                        <h2 className="font-bold text-sm">Quickstart</h2>
                    </div>
                    <button
                        onClick={copyCurl}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                            copied
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300'
                        }`}
                    >
                        {copied ? <Check size={13} /> : <Copy size={13} />}
                        {copied ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <pre className="text-xs font-mono text-neutral-300 bg-neutral-950 border border-white/10 rounded-xl p-4 overflow-x-auto whitespace-pre">
                    {CURL_EXAMPLE}
                </pre>
            </section>

            {/* Endpoints */}
            <section className="glass-surface rounded-2xl border border-white/5 bg-neutral-950/40 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h2 className="font-bold text-sm text-white">Endpoint Reference</h2>
                    <p className="text-xs text-neutral-500 mt-1">
                        Full request/response schemas are available in the interactive explorer.
                    </p>
                </div>
                <div className="divide-y divide-white/5">
                    {ENDPOINT_GROUPS.map((group) => (
                        <div key={group.title} className="p-5">
                            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-3">
                                {group.title}
                            </h3>
                            <div className="space-y-2">
                                {group.endpoints.map((endpoint) => (
                                    <div
                                        key={`${endpoint.method}-${endpoint.path}`}
                                        className="flex items-center gap-3 flex-wrap"
                                    >
                                        <span
                                            className={`shrink-0 w-16 text-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${METHOD_COLORS[endpoint.method]}`}
                                        >
                                            {endpoint.method}
                                        </span>
                                        <code className="text-xs font-mono text-white">
                                            {endpoint.path}
                                        </code>
                                        <span className="text-xs text-neutral-500 flex-1 min-w-0">
                                            {endpoint.description}
                                        </span>
                                        {endpoint.auth === 'auth' && (
                                            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-400/70 flex items-center gap-1">
                                                <KeyRound size={10} />
                                                Auth
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
