import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api.js';
import { Search, Trash2, RefreshCw, ChevronLeft, ChevronRight, Filter, Calendar, Database, Eye, X, Share2 } from 'lucide-react';

interface DecodeStep {
    decoderName: string;
    confidence: number;
    output: string;
}

interface HistoryEntry {
    _id: string;
    userId: string;
    originalInput: string;
    steps: DecodeStep[];
    finalOutput: string;
    createdAt: string;
}

export default function HistoryPage() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<HistoryEntry[]>([]);
    const [sharingId, setSharingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [shareErrorId, setShareErrorId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    
    // Filters State
    const [search, setSearch] = useState('');
    const [encodingType, setEncodingType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

    // List of decoder types for the filter dropdown
    const DECODER_TYPES = [
        { id: 'hex', label: 'Hex' },
        { id: 'base64', label: 'Base64' },
        { id: 'morse', label: 'Morse' },
        { id: 'jwt', label: 'JWT' },
        { id: 'binary', label: 'Binary' },
        { id: 'url', label: 'URL' },
        { id: 'rot13', label: 'Rot13' },
        { id: 'caesar', label: 'Caesar' }
    ];

    async function fetchHistory() {
        setLoading(true);
        setError(null);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('limit', limit.toString());
            if (search.trim()) params.append('search', search.trim());
            if (encodingType) params.append('encodingType', encodingType);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await api.get<any>(`/history?${params.toString()}`);
            if (response.ok) {
                setEntries(response.entries);
                setTotal(response.total);
                setTotalPages(response.totalPages || 1);
            } else {
                setError(response.error || 'Failed to fetch history');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred while fetching history');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHistory();
        }, 300); // Small debounce for typing search
        return () => clearTimeout(timer);
    }, [page, limit, search, encodingType, startDate, endDate]);

    async function handleDeleteEntry(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this history item?')) return;
        
        try {
            const response = await api.delete<any>(`/history/${id}`);
            if (response.ok) {
                fetchHistory();
            } else {
                alert(response.error || 'Failed to delete history entry');
            }
        } catch (err: any) {
            alert(err.message || 'Error deleting entry');
        }
    }

    async function handleClearAll() {
        if (!window.confirm('Are you sure you want to clear your entire decode history?')) return;
        
        try {
            const response = await api.delete<any>('/history');
            if (response.ok) {
                setPage(1);
                fetchHistory();
            } else {
                alert(response.error || 'Failed to clear history');
            }
        } catch (err: any) {
            alert(err.message || 'Error clearing history');
        }
    }

    function handleReDecode(originalInput: string, e: React.MouseEvent) {
        e.stopPropagation();
        navigate(`/decode?payload=${encodeURIComponent(originalInput)}`);
    }

    async function handleShareEntry(id: string, e: React.MouseEvent) {
        e.stopPropagation();
        setSharingId(id);
        setCopiedId(null);
        setShareErrorId(null);

        try {
            const response = await api.post<{ ok: boolean; share: { slug: string } }>('/share', {
                historyId: id,
                expiresInDays: 30,
            });

            if (response.ok && response.share?.slug) {
                const shareUrl = `${window.location.origin}/s/${response.share.slug}`;
                await navigator.clipboard.writeText(shareUrl);
                setCopiedId(id);
                setTimeout(() => {
                    setCopiedId(null);
                }, 2000);
            } else {
                setShareErrorId(id);
                setTimeout(() => {
                    setShareErrorId(null);
                }, 3000);
            }
        } catch (err) {
            console.error('Failed to share history entry:', err);
            setShareErrorId(id);
            setTimeout(() => {
                setShareErrorId(null);
            }, 3000);
        } finally {
            setSharingId(null);
        }
    }

    function toggleExpand(id: string) {
        setExpandedEntryId(expandedEntryId === id ? null : id);
    }

    return (
        <main className="decode-page max-w-6xl mx-auto px-4 py-8">
            <section className="decode-hero mb-8">
                <p className="decode-kicker">Manage History</p>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-white">Decode History</h1>
                        <p className="decode-subtitle text-neutral-400 text-sm mt-2">
                            Review, search, filter, and re-run your previous string decodings.
                        </p>
                    </div>
                    {entries.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 hover:border-red-500/40 text-red-300 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-2"
                        >
                            <Trash2 size={14} />
                            Clear All History
                        </button>
                    )}
                </div>
            </section>

            {/* Filter Bar Panel */}
            <section className="glass-surface p-6 rounded-2xl border border-white/5 bg-neutral-950/40 mb-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search Field */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500">
                            <Search size={16} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search inputs or outputs..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    {/* Encoding Type Filter */}
                    <div className="relative">
                        <select
                            value={encodingType}
                            onChange={(e) => { setEncodingType(e.target.value); setPage(1); }}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">All Encoding Types</option>
                            {DECODER_TYPES.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                            ))}
                        </select>
                        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-neutral-500">
                            <Filter size={14} />
                        </span>
                    </div>

                    {/* Start Date Filter */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500 pointer-events-none">
                            <Calendar size={14} />
                        </span>
                        <input
                            type="date"
                            placeholder="Start Date"
                            value={startDate}
                            onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    {/* End Date Filter */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-neutral-500 pointer-events-none">
                            <Calendar size={14} />
                        </span>
                        <input
                            type="date"
                            placeholder="End Date"
                            value={endDate}
                            onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                            className="w-full bg-neutral-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>
            </section>

            {/* Main History List Container */}
            <section className="glass-surface rounded-2xl border border-white/5 bg-neutral-950/40 overflow-hidden relative z-10">
                {loading && entries.length === 0 ? (
                    <div className="p-16 text-center text-neutral-500 flex flex-col items-center gap-3">
                        <RefreshCw size={24} className="animate-spin text-blue-500" />
                        <span>Loading decode history...</span>
                    </div>
                ) : error ? (
                    <div className="p-16 text-center text-red-400">
                        {error}
                    </div>
                ) : entries.length === 0 ? (
                    <div className="p-16 text-center text-neutral-500 flex flex-col items-center gap-4">
                        <Database size={32} className="text-neutral-700" />
                        <div>
                            <p className="font-bold text-white text-sm">No History Found</p>
                            <p className="text-xs text-neutral-500 mt-1">Try broadening your filters or decode a new string.</p>
                        </div>
                        <Link to="/decode" className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200 transition-colors mt-2">
                            Go to Decoder Workspace
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-white/5">
                            {entries.map((entry) => {
                                const isExpanded = expandedEntryId === entry._id;
                                return (
                                    <div 
                                        key={entry._id}
                                        onClick={() => toggleExpand(entry._id)}
                                        className="p-5 hover:bg-white/[0.02] cursor-pointer transition-colors duration-150"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Left Meta & Input Preview */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                                                        {new Date(entry.createdAt).toLocaleString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                    
                                                    {/* Pipeline sequence visual badges */}
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {entry.steps.map((step, idx) => (
                                                            <div key={idx} className="flex items-center gap-1.5">
                                                                {idx > 0 && <span className="text-neutral-600 text-xs">➔</span>}
                                                                <span className="px-2 py-0.5 bg-blue-950/30 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                                                    {step.decoderName}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {/* Text inputs previews */}
                                                <div className="text-sm font-mono text-white truncate max-w-xl">
                                                    {entry.originalInput}
                                                </div>
                                            </div>

                                            {/* Right Action Trigger Buttons */}
                                            <div className="flex items-center gap-2.5">
                                                <button
                                                    onClick={(e) => handleShareEntry(entry._id, e)}
                                                    disabled={sharingId === entry._id}
                                                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                                                        copiedId === entry._id
                                                            ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-400'
                                                            : shareErrorId === entry._id
                                                              ? 'bg-red-950/40 border border-red-500/30 text-red-400'
                                                              : 'bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-neutral-300 hover:text-white'
                                                    }`}
                                                    title={
                                                        copiedId === entry._id
                                                            ? 'Copied to clipboard!'
                                                            : shareErrorId === entry._id
                                                              ? 'Failed to generate share link'
                                                              : 'Share public link'
                                                    }
                                                >
                                                    <Share2 size={14} className={sharingId === entry._id ? 'animate-pulse' : ''} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleReDecode(entry.originalInput, e)}
                                                    className="p-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 hover:border-white/10 text-neutral-300 hover:text-white rounded-lg transition-colors flex items-center justify-center"
                                                    title="Re-decode in workspace"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => handleDeleteEntry(entry._id, e)}
                                                    className="p-2 bg-red-950/20 hover:bg-red-950/50 border border-red-500/10 hover:border-red-500/30 text-red-400/80 hover:text-red-400 rounded-lg transition-colors flex items-center justify-center"
                                                    title="Delete history entry"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <span className="text-neutral-600 text-xs px-1 select-none">
                                                    {isExpanded ? <X size={14} /> : <Eye size={14} />}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Expanded Detailed Pipeline Panel */}
                                        {isExpanded && (
                                            <div 
                                                className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4"
                                                onClick={(e) => e.stopPropagation()} // Prevent collapse on container click
                                            >
                                                <div className="bg-neutral-950/60 p-4 border border-white/5 rounded-xl">
                                                    <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Original Payload</span>
                                                    <pre className="text-xs text-neutral-300 font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all">
                                                        {entry.originalInput}
                                                    </pre>
                                                </div>
                                                <div className="bg-neutral-950/60 p-4 border border-white/5 rounded-xl">
                                                    <span className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Final Decoded Output</span>
                                                    <pre className="text-xs text-white font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all">
                                                        {entry.finalOutput}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Row */}
                        {totalPages > 1 && (
                            <div className="p-4 bg-neutral-950/60 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
                                <div>
                                    Showing <span className="text-white font-semibold">{(page - 1) * limit + 1}</span> to <span className="text-white font-semibold">{Math.min(page * limit, total)}</span> of <span className="text-white font-semibold">{total}</span> decodes
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                                        className="p-1.5 rounded-lg border border-white/5 bg-neutral-900 text-neutral-400 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-400 transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="font-mono text-neutral-300">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        disabled={page === totalPages}
                                        onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                        className="p-1.5 rounded-lg border border-white/5 bg-neutral-900 text-neutral-400 hover:text-white disabled:opacity-40 disabled:hover:text-neutral-400 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
}
