import { useState } from 'react';
import type { DecodeResult, CompareResponse } from '@rasbur/shared';
import { api } from '@/services/api.js';
import DecodePipeline from '@/components/DecodePipeline.js';
import { ArrowLeftRight, RefreshCw, Play, AlertCircle } from 'lucide-react';

export default function ComparePage() {
    const [inputA, setInputA] = useState('');
    const [inputB, setInputB] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [compareResult, setCompareResult] = useState<CompareResponse | null>(null);

    async function handleCompare() {
        const valA = inputA.trim();
        const valB = inputB.trim();

        if (!valA || !valB) {
            setError('Please enter both inputs to run comparison.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post<CompareResponse>('/compare', {
                inputA: valA,
                inputB: valB,
            });

            if (response.ok) {
                setCompareResult(response);
            } else {
                setError('Failed to calculate comparison diff.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during comparison.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="decode-page max-w-6xl mx-auto px-4 py-8">
            <section className="decode-hero mb-8">
                <p className="decode-kicker">Side-by-Side Comparison</p>
                <h1 className="text-3xl font-black text-white">Compare Encoded Strings</h1>
                <p className="decode-subtitle text-neutral-400 text-sm mt-2">
                    Enter two different payloads, decode them simultaneously, and inspect character-level differences.
                </p>
            </section>

            <section className="compare-grid mb-8">
                <div className="decode-panel glass-surface bg-neutral-950/40 border border-white/5 p-6 rounded-2xl">
                    <div className="panel-header mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white">Payload A</h2>
                            <p className="panel-meta text-xs text-neutral-500">First encoded input string</p>
                        </div>
                    </div>
                    <textarea
                        rows={8}
                        value={inputA}
                        onChange={(e) => setInputA(e.target.value)}
                        placeholder="Paste first encoded string..."
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50 resize-y"
                    />
                </div>

                <div className="decode-panel glass-surface bg-neutral-950/40 border border-white/5 p-6 rounded-2xl">
                    <div className="panel-header mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-white">Payload B</h2>
                            <p className="panel-meta text-xs text-neutral-500">Second encoded input string</p>
                        </div>
                    </div>
                    <textarea
                        rows={8}
                        value={inputB}
                        onChange={(e) => setInputB(e.target.value)}
                        placeholder="Paste second encoded string..."
                        className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:border-blue-500/50 resize-y"
                    />
                </div>
            </section>

            <div className="flex flex-col items-center justify-center gap-4 mb-8">
                <button
                    type="button"
                    onClick={handleCompare}
                    disabled={loading}
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 disabled:opacity-50 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-black/30"
                >
                    {loading ? (
                        <RefreshCw size={16} className="animate-spin" />
                    ) : (
                        <ArrowLeftRight size={16} />
                    )}
                    {loading ? 'Diffing...' : 'Compare Payloads'}
                </button>

                {error && (
                    <div className="flex items-center gap-2 text-red-400 text-sm font-semibold bg-red-950/20 border border-red-500/10 px-4 py-2.5 rounded-xl">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}
            </div>

            {compareResult && (
                <section className="compare-results-section">
                    <div className="compare-grid">
                        <div className="result-panel glass-surface bg-neutral-950/40 border border-white/5 p-6 rounded-2xl">
                            <div className="result-header mb-6">
                                <div>
                                    <p className="result-kicker">Output A</p>
                                    <h2 className="text-xl font-bold text-white">Decoded Result A</h2>
                                </div>
                                <span className="result-badge px-3 py-1 bg-white/5 border border-white/10 text-white rounded-full text-xs font-bold">
                                    {compareResult.resultA.steps.length} {compareResult.resultA.steps.length === 1 ? 'step' : 'steps'}
                                </span>
                            </div>

                            <div className="result-grid gap-4 mb-6">
                                <div className="result-block bg-neutral-950/60 p-4 border border-white/5 rounded-xl">
                                    <p className="block-label text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Diff Highlights</p>
                                    <pre className="text-sm font-mono overflow-auto max-h-60 whitespace-pre-wrap break-all leading-relaxed">
                                        {compareResult.diff.map((part, index) => {
                                            if (part.added) return null;
                                            return (
                                                <span
                                                    key={index}
                                                    className={part.removed ? 'diff-char-removed' : ''}
                                                >
                                                    {part.value}
                                                </span>
                                            );
                                        })}
                                    </pre>
                                </div>
                            </div>

                            <div className="result-block bg-neutral-950/40 p-4 border border-white/5 rounded-xl">
                                <div className="steps-header mb-4">
                                    <h3 className="text-sm font-bold text-white">Pipeline Steps</h3>
                                </div>
                                <DecodePipeline steps={compareResult.resultA.steps} />
                            </div>
                        </div>

                        <div className="result-panel glass-surface bg-neutral-950/40 border border-white/5 p-6 rounded-2xl">
                            <div className="result-header mb-6">
                                <div>
                                    <p className="result-kicker">Output B</p>
                                    <h2 className="text-xl font-bold text-white">Decoded Result B</h2>
                                </div>
                                <span className="result-badge px-3 py-1 bg-white/5 border border-white/10 text-white rounded-full text-xs font-bold">
                                    {compareResult.resultB.steps.length} {compareResult.resultB.steps.length === 1 ? 'step' : 'steps'}
                                </span>
                            </div>

                            <div className="result-grid gap-4 mb-6">
                                <div className="result-block bg-neutral-950/60 p-4 border border-white/5 rounded-xl">
                                    <p className="block-label text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Diff Highlights</p>
                                    <pre className="text-sm font-mono overflow-auto max-h-60 whitespace-pre-wrap break-all leading-relaxed">
                                        {compareResult.diff.map((part, index) => {
                                            if (part.removed) return null;
                                            return (
                                                <span
                                                    key={index}
                                                    className={part.added ? 'diff-char-added' : ''}
                                                >
                                                    {part.value}
                                                </span>
                                            );
                                        })}
                                    </pre>
                                </div>
                            </div>

                            <div className="result-block bg-neutral-950/40 p-4 border border-white/5 rounded-xl">
                                <div className="steps-header mb-4">
                                    <h3 className="text-sm font-bold text-white">Pipeline Steps</h3>
                                </div>
                                <DecodePipeline steps={compareResult.resultB.steps} />
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
}
