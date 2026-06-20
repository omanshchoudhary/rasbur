import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import type { ShareData } from '@rasbur/shared';
import { api } from '@/services/api.js';
import DecodePipeline from '@/components/DecodePipeline.js';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';

export default function SharedResultPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSharedResult() {
            if (!slug) return;
            setLoading(true);
            setError(null);
            try {
                const response = await api.get<any>(`/share/${slug}`);
                if (response.ok && response.share) {
                    setShareData(response.share);
                } else {
                    setError(response.error || 'Failed to load shared decode snapshot.');
                }
            } catch (err: any) {
                setError(err.message || 'Shared snapshot has expired or does not exist.');
            } finally {
                setLoading(false);
            }
        }
        fetchSharedResult();
    }, [slug]);

    function handleCloneToWorkspace() {
        if (shareData?.historyId?.originalInput) {
            navigate(`/decode?payload=${encodeURIComponent(shareData.historyId.originalInput)}`);
        }
    }

    if (loading) {
        return (
            <main className="decode-page max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
                <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
                <p className="text-neutral-400 text-sm">Retrieving shared decode snapshot...</p>
            </main>
        );
    }

    if (error || !shareData || !shareData.historyId) {
        return (
            <main className="decode-page max-w-md mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <AlertCircle size={40} className="text-red-500 mb-4 animate-pulse" />
                <h1 className="text-xl font-bold text-white mb-2">Snapshot Unavailable</h1>
                <p className="text-neutral-500 text-sm mb-6 leading-relaxed">
                    {error ||
                        'The requested decode history snapshot has expired or does not exist.'}
                </p>
                <div className="flex gap-4">
                    <Link
                        to="/decode"
                        className="px-5 py-2.5 bg-white text-black! text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                        Open Workspace
                    </Link>
                    <Link
                        to="/"
                        className="px-5 py-2.5 border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/5 transition-colors"
                    >
                        Return Home
                    </Link>
                </div>
            </main>
        );
    }

    const { historyId, viewCount, expiresAt, createdAt } = shareData;

    return (
        <main className="decode-page max-w-4xl mx-auto px-4 py-8">
            {/* Header Metadata Section */}
            <section className="decode-hero mb-8 border-b border-white/5 pb-6">
                <p className="decode-kicker">Shared Decode Snapshot</p>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white">Snapshot: {slug}</h1>
                        <div className="flex items-center gap-3 text-xs text-neutral-500 mt-2 flex-wrap">
                            <span>Shared on {new Date(createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>
                                {viewCount} {viewCount === 1 ? 'view' : 'views'}
                            </span>
                            <span>•</span>
                            <span className="text-amber-500/80">
                                Expires {new Date(expiresAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={handleCloneToWorkspace}
                        className="px-5 py-2.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors flex items-center gap-2 relative z-10"
                    >
                        <RefreshCw size={14} />
                        Clone into Workspace
                    </button>
                </div>
            </section>

            {/* Inputs / Outputs Section */}
            <section className="decode-shell">
                {/* Original Input Payload */}
                <div className="decode-panel glass-surface bg-neutral-950/40 border border-white/5 p-6 rounded-2xl">
                    <div className="panel-header mb-4">
                        <h2 className="text-lg font-bold text-white">Original Input</h2>
                        <p className="panel-meta text-xs text-neutral-500 mt-1">
                            Shared encoded payload
                        </p>
                    </div>
                    <pre className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-sm text-neutral-300 font-mono overflow-auto max-h-60 whitespace-pre-wrap break-all">
                        {historyId.originalInput}
                    </pre>
                </div>

                {/* Final Decoded Output */}
                <div className="result-panel glass-surface bg-neutral-950/40 border border-white/5 p-6 rounded-2xl">
                    <div className="result-header mb-4">
                        <h2 className="text-lg font-bold text-white">Final Output</h2>
                        <p className="steps-meta text-xs text-neutral-500 mt-1">
                            Result of execution pipeline
                        </p>
                    </div>
                    <pre className="w-full bg-neutral-900/60 border border-white/10 rounded-xl p-4 text-sm text-white font-mono overflow-auto max-h-60 whitespace-pre-wrap break-all">
                        {historyId.finalOutput}
                    </pre>
                </div>
            </section>

            {/* Pipeline Visualizer Steps */}
            {historyId.steps && historyId.steps.length > 0 && (
                <section className="mt-8 glass-surface bg-neutral-950/40 border border-white/5 p-6 rounded-2xl relative z-10">
                    <div className="steps-header mb-6">
                        <h3 className="text-lg font-bold text-white">Pipeline Execution Steps</h3>
                        <p className="steps-meta text-xs text-neutral-500 mt-1">
                            Sequence of active decoder transformations applied
                        </p>
                    </div>
                    <DecodePipeline steps={historyId.steps} />
                </section>
            )}
        </main>
    );
}
