import { useEffect, useState } from 'react';
import type { ApiKeyListItem, CreateApiKeyResult, ApiKeyUsage } from '@rasbur/shared';
import { api } from '@/services/api.js';
import {
    KeyRound,
    Plus,
    Copy,
    Check,
    Trash2,
    BarChart3,
    X,
    ShieldCheck,
    AlertTriangle,
    RefreshCw,
    Loader2,
} from 'lucide-react';

const ALL_PERMISSIONS = ['decode', 'history', 'share', 'compare'] as const;
type Permission = (typeof ALL_PERMISSIONS)[number];

const PERMISSION_LABELS: Record<Permission, string> = {
    decode: 'Decode',
    history: 'History',
    share: 'Share',
    compare: 'Compare',
};

function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function ApiKeysPage() {
    const [keys, setKeys] = useState<ApiKeyListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create form
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [permissions, setPermissions] = useState<Permission[]>(['decode']);
    const [expiresAt, setExpiresAt] = useState('');
    const [creating, setCreating] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Show-once reveal
    const [newKey, setNewKey] = useState<CreateApiKeyResult | null>(null);
    const [copied, setCopied] = useState(false);

    // Per-row state
    const [revokingId, setRevokingId] = useState<string | null>(null);
    const [usage, setUsage] = useState<Record<string, ApiKeyUsage>>({});
    const [usageLoadingId, setUsageLoadingId] = useState<string | null>(null);

    async function loadKeys() {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get<{ ok: boolean; apiKeys: ApiKeyListItem[] }>('/keys');
            setKeys(res.apiKeys);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load API keys.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadKeys();
    }, []);

    function togglePermission(permission: Permission) {
        setPermissions((prev) =>
            prev.includes(permission) ? prev.filter((p) => p !== permission) : [...prev, permission]
        );
    }

    function resetForm() {
        setName('');
        setPermissions(['decode']);
        setExpiresAt('');
        setFormError(null);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);

        if (!name.trim()) {
            setFormError('Please give your key a name.');
            return;
        }
        if (permissions.length === 0) {
            setFormError('Select at least one permission scope.');
            return;
        }

        setCreating(true);
        try {
            const body: { name: string; permissions: Permission[]; expiresAt?: string } = {
                name: name.trim(),
                permissions,
            };
            if (expiresAt) {
                body.expiresAt = new Date(expiresAt).toISOString();
            }

            const res = await api.post<{ ok: boolean; apiKey: CreateApiKeyResult }>('/keys', body);
            if (res.ok && res.apiKey) {
                setNewKey(res.apiKey);
                setCopied(false);
                setShowForm(false);
                resetForm();
                loadKeys();
            } else {
                setFormError('Failed to create API key.');
            }
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to create API key.');
        } finally {
            setCreating(false);
        }
    }

    async function handleCopy(rawKey: string) {
        try {
            await navigator.clipboard.writeText(rawKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* clipboard unavailable — user can still select manually */
        }
    }

    async function handleRevoke(id: string) {
        if (
            !window.confirm(
                'Revoke this API key? Applications using it will stop working immediately.'
            )
        ) {
            return;
        }
        setRevokingId(id);
        try {
            const res = await api.delete<{ ok: boolean }>(`/keys/${id}`);
            if (res.ok) {
                loadKeys();
            } else {
                alert('Failed to revoke API key.');
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to revoke API key.');
        } finally {
            setRevokingId(null);
        }
    }

    async function handleViewUsage(id: string) {
        // Toggle off if already shown
        if (usage[id]) {
            setUsage((prev) => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            return;
        }
        setUsageLoadingId(id);
        try {
            const res = await api.get<{ ok: boolean; usage: ApiKeyUsage }>(`/keys/${id}/usage`);
            if (res.ok && res.usage) {
                setUsage((prev) => ({ ...prev, [id]: res.usage }));
            }
        } catch {
            /* ignore — usage is non-critical */
        } finally {
            setUsageLoadingId(null);
        }
    }

    return (
        <main className="decode-page max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <section className="decode-hero mb-8">
                <p className="decode-kicker">Developer Settings</p>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white">API Keys</h1>
                        <p className="decode-subtitle text-neutral-400 text-sm mt-2">
                            Create and manage keys to access the Rasbur API from your own tools and
                            scripts.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setShowForm((s) => !s);
                            setFormError(null);
                        }}
                        className="px-4 py-2 bg-white text-black rounded-lg text-sm font-bold transition-all duration-200 hover:bg-neutral-200 flex items-center gap-2"
                    >
                        {showForm ? <X size={16} /> : <Plus size={16} />}
                        {showForm ? 'Cancel' : 'Create API Key'}
                    </button>
                </div>
            </section>

            {/* Show-once reveal banner */}
            {newKey && (
                <section className="glass-surface rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6 mb-8 relative">
                    <button
                        onClick={() => setNewKey(null)}
                        className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
                        aria-label="Dismiss"
                    >
                        <X size={16} />
                    </button>
                    <div className="flex items-center gap-2 mb-2 text-emerald-400">
                        <ShieldCheck size={18} />
                        <h2 className="font-bold text-sm">API key created — copy it now</h2>
                    </div>
                    <p className="text-xs text-amber-300/90 flex items-center gap-1.5 mb-4">
                        <AlertTriangle size={13} />
                        This is the only time you'll see the full key. Store it somewhere safe.
                    </p>
                    <div className="flex items-center gap-2 bg-neutral-950 border border-white/10 rounded-xl p-3">
                        <code className="flex-1 text-sm font-mono text-emerald-300 break-all">
                            {newKey.rawKey}
                        </code>
                        <button
                            onClick={() => handleCopy(newKey.rawKey)}
                            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                copied
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-white text-black hover:bg-neutral-200'
                            }`}
                        >
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>
                </section>
            )}

            {/* Create form */}
            {showForm && (
                <section className="glass-surface rounded-2xl border border-white/5 bg-neutral-950/40 p-6 mb-8">
                    <form onSubmit={handleCreate} className="space-y-5">
                        <div className="space-y-2">
                            <label
                                htmlFor="key-name"
                                className="block text-xs font-bold uppercase tracking-wider text-neutral-400"
                            >
                                Key Name
                            </label>
                            <input
                                id="key-name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={50}
                                placeholder="e.g. Production CLI"
                                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        <div className="space-y-2">
                            <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">
                                Permission Scopes
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {ALL_PERMISSIONS.map((permission) => {
                                    const active = permissions.includes(permission);
                                    return (
                                        <button
                                            type="button"
                                            key={permission}
                                            onClick={() => togglePermission(permission)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                                active
                                                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                                                    : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                                            }`}
                                        >
                                            {PERMISSION_LABELS[permission]}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="key-expiry"
                                className="block text-xs font-bold uppercase tracking-wider text-neutral-400"
                            >
                                Expiry{' '}
                                <span className="text-neutral-600 normal-case font-medium">
                                    (optional)
                                </span>
                            </label>
                            <input
                                id="key-expiry"
                                type="date"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                className="w-full sm:w-auto bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                            />
                        </div>

                        {formError && (
                            <p className="text-xs text-red-400 flex items-center gap-1.5">
                                <AlertTriangle size={13} />
                                {formError}
                            </p>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={creating}
                                className="px-5 py-2.5 bg-white text-black rounded-lg text-sm font-bold hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                                {creating ? (
                                    <Loader2 size={15} className="animate-spin" />
                                ) : (
                                    <KeyRound size={15} />
                                )}
                                {creating ? 'Generating…' : 'Generate Key'}
                            </button>
                        </div>
                    </form>
                </section>
            )}

            {/* Keys list */}
            <section className="glass-surface rounded-2xl border border-white/5 bg-neutral-950/40 overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-neutral-500 flex flex-col items-center gap-3">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <span>Loading API keys…</span>
                    </div>
                ) : error ? (
                    <div className="p-16 text-center text-red-400">{error}</div>
                ) : keys.length === 0 ? (
                    <div className="p-16 text-center text-neutral-500 flex flex-col items-center gap-4">
                        <KeyRound size={32} className="text-neutral-700" />
                        <div>
                            <p className="font-bold text-white text-sm">No API keys yet</p>
                            <p className="text-xs text-neutral-500 mt-1">
                                Create your first key to start calling the Rasbur API
                                programmatically.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {keys.map((key) => {
                            const keyUsage = usage[key.id];
                            return (
                                <div key={key.id} className="p-5">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        {/* Left: identity */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                                                <span className="font-bold text-white text-sm">
                                                    {key.name}
                                                </span>
                                                {key.isActive ? (
                                                    <span className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-red-950/40 border border-red-500/20 text-red-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                                        Revoked
                                                    </span>
                                                )}
                                            </div>
                                            <code className="text-xs font-mono text-neutral-400">
                                                {key.prefix}…
                                            </code>
                                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                {key.permissions.map((p) => (
                                                    <span
                                                        key={p}
                                                        className="px-2 py-0.5 bg-blue-950/30 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider"
                                                    >
                                                        {p}
                                                    </span>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-neutral-600 mt-2 font-mono uppercase tracking-wider">
                                                Created {formatDate(key.createdAt)}
                                                {key.expiresAt
                                                    ? ` · Expires ${formatDate(key.expiresAt)}`
                                                    : ''}
                                            </p>
                                        </div>

                                        {/* Right: actions */}
                                        <div className="flex items-center gap-2.5">
                                            <button
                                                onClick={() => handleViewUsage(key.id)}
                                                disabled={usageLoadingId === key.id}
                                                className={`p-2 rounded-lg transition-colors flex items-center justify-center border ${
                                                    keyUsage
                                                        ? 'bg-blue-950/40 border-blue-500/30 text-blue-300'
                                                        : 'bg-neutral-900 hover:bg-neutral-800 border-white/5 hover:border-white/10 text-neutral-300 hover:text-white'
                                                }`}
                                                title="View usage"
                                            >
                                                {usageLoadingId === key.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <BarChart3 size={14} />
                                                )}
                                            </button>
                                            {key.isActive && (
                                                <button
                                                    onClick={() => handleRevoke(key.id)}
                                                    disabled={revokingId === key.id}
                                                    className="p-2 bg-red-950/20 hover:bg-red-950/50 border border-red-500/10 hover:border-red-500/30 text-red-400/80 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                                                    title="Revoke key"
                                                >
                                                    {revokingId === key.id ? (
                                                        <Loader2
                                                            size={14}
                                                            className="animate-spin"
                                                        />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Usage panel */}
                                    {keyUsage && (
                                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <UsageStat
                                                label="Today"
                                                value={keyUsage.today.toLocaleString()}
                                            />
                                            <UsageStat
                                                label="Daily Limit"
                                                value={keyUsage.limit.toLocaleString()}
                                            />
                                            <UsageStat
                                                label="Remaining"
                                                value={keyUsage.remaining.toLocaleString()}
                                            />
                                            <UsageStat
                                                label="Lifetime"
                                                value={keyUsage.usageCount.toLocaleString()}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}

function UsageStat({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-neutral-950/60 border border-white/5 rounded-xl p-3">
            <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1">
                {label}
            </span>
            <span className="text-lg font-black text-white font-mono">{value}</span>
        </div>
    );
}
