import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ShareData } from '@rasbur/shared';
import { api } from '@/services/api.js';
import { RefreshCw, Database, AlertCircle } from 'lucide-react';

export default function SharedResultPage() {
    const { slug } = useParams<{ slug: string }>();
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
                    {error || 'The requested decode history snapshot has expired or does not exist.'}
                </p>
                <div className="flex gap-4">
                    <Link to="/decode" className="px-5 py-2.5 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors">
                        Open Workspace
                    </Link>
                    <Link to="/" className="px-5 py-2.5 border border-white/10 text-white text-xs font-bold rounded-lg hover:bg-white/5 transition-colors">
                        Return Home
                    </Link>
                </div>
            </main>
        );
    }

    // Temporary placeholder for visual component rendering
    return (
        <main className="decode-page max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-white">Shared Snapshot Found: {shareData.slug}</h1>
        </main>
    );
}
