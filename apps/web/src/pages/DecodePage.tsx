import { useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DecodeResult, DecodeOptions, DecoderInfo } from '@rasbur/shared';
import { api } from '@/services/api.js';
import DecodePipeline from '@/components/DecodePipeline.js';
import { useWebSocket } from '@/hooks/useWebSocket.js';
import { useAuth } from '@/context/AuthContext.js';
import {
    Share2,
    Copy,
    Check,
    CornerUpLeft,
    ClipboardPaste,
    Eraser,
    Sparkles,
    ScanSearch,
    Loader2,
    AlertTriangle,
} from 'lucide-react';

type RequestState = 'idle' | 'loading' | 'success' | 'error';

type LiveDecodeSuccess = {
    ok: true;
    result: DecodeResult;
};

type LiveDecodeError = {
    ok: false;
    error: string;
    issues?: Array<{ path: string; message: string }>;
};

type LiveDecodeResponse = LiveDecodeSuccess | LiveDecodeError;

const LIVE_DECODE_DELAY_MS = 300;

// Base64 -> Hex -> "Hello Rasbur": demonstrates a multi-layer pipeline
const SAMPLE_INPUT = 'NDg2NTZjNmM2ZjIwNTI2MTczNjI3NTcy';

export default function DecodePage() {
    const [searchParams] = useSearchParams();
    const [input, setInput] = useState(searchParams.get('payload') || '');
    const [result, setResult] = useState<DecodeResult | null>(null);
    const [requestState, setRequestState] = useState<RequestState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [decodeSource, setDecodeSource] = useState<'live' | 'rest' | null>(null);

    const { socket, status, isConnected } = useWebSocket();
    const { isAuthenticated } = useAuth();
    const [shareState, setShareState] = useState<'idle' | 'sharing' | 'copied' | 'error'>('idle');
    const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
    const [decoders, setDecoders] = useState<DecoderInfo[]>([]);
    const [forcedDecoder, setForcedDecoder] = useState('');

    useEffect(() => {
        async function loadDecoders() {
            try {
                const list = await api.getDecoders();
                setDecoders(list);
            } catch {
                // selector falls back to auto-detect only
            }
        }
        void loadDecoders();
    }, []);

    async function handlePasteInput() {
        try {
            const text = await navigator.clipboard.readText();
            if (text) setInput(text);
        } catch (err) {
            console.error('Error reading clipboard:', err);
        }
    }

    async function handleCopyOutput() {
        if (!result) return;
        try {
            await navigator.clipboard.writeText(result.finalOutput);
            setCopyState('copied');
            setTimeout(() => setCopyState('idle'), 1500);
        } catch (err) {
            console.error('Error copying output:', err);
        }
    }

    function handleUseAsInput() {
        if (!result) return;
        setInput(result.finalOutput);
    }

    async function handleShareWorkspaceResult() {
        if (!result) return;
        setShareState('sharing');

        try {
            const historyResponse = await api.post<{ ok: boolean; history: { _id: string } }>(
                '/history',
                {
                    originalInput: result.originalInput,
                    steps: result.steps,
                    finalOutput: result.finalOutput,
                }
            );

            if (!historyResponse.ok || !historyResponse.history?._id) {
                throw new Error('Failed to create history entry');
            }

            const shareResponse = await api.post<{ ok: boolean; share: { slug: string } }>(
                '/share',
                {
                    historyId: historyResponse.history._id,
                    expiresInDays: 30,
                }
            );

            if (!shareResponse.ok || !shareResponse.share?.slug) {
                throw new Error('Failed to create share link');
            }

            const shareUrl = `${window.location.origin}/s/${shareResponse.share.slug}`;
            await navigator.clipboard.writeText(shareUrl);

            setShareState('copied');
            setTimeout(() => {
                setShareState('idle');
            }, 2000);
        } catch (err) {
            console.error('Error sharing result:', err);
            setShareState('error');
            setTimeout(() => {
                setShareState('idle');
            }, 3000);
        }
    }

    const decodeOptions: DecodeOptions | undefined = forcedDecoder
        ? { forceDecoder: forcedDecoder }
        : undefined;

    async function decodeWithRest(value: string) {
        const decodeResult = await api.decode(value, decodeOptions);
        setResult(decodeResult);
        setRequestState('success');
        setErrorMessage(null);
        setDecodeSource('rest');
    }

    async function handleDecode() {
        const trimmedInput = input.trim();

        if (!trimmedInput) {
            setRequestState('error');
            setErrorMessage('Please enter something to decode.');
            setResult(null);
            setDecodeSource(null);
            return;
        }

        try {
            setRequestState('loading');
            setErrorMessage(null);
            setResult(null);

            await decodeWithRest(trimmedInput);
        } catch (err) {
            setRequestState('error');
            setErrorMessage('Failed to decode input.');
            setResult(null);
            setDecodeSource(null);
        }
    }

    useEffect(() => {
        const trimmedInput = input.trim();

        if (!trimmedInput) {
            setResult(null);
            setRequestState('idle');
            setErrorMessage(null);
            setDecodeSource(null);
            return;
        }

        let cancelled = false;

        async function runRestFallback() {
            try {
                const decodeResult = await api.decode(
                    trimmedInput,
                    forcedDecoder ? { forceDecoder: forcedDecoder } : undefined
                );

                if (cancelled) {
                    return;
                }
                setResult(decodeResult);
                setRequestState('success');
                setErrorMessage(null);
                setDecodeSource('rest');
            } catch (err) {
                if (cancelled) {
                    return;
                }

                setRequestState('error');
                setErrorMessage('Failed to decode input.');
                setResult(null);
                setDecodeSource(null);
            }
        }
        setRequestState('loading');
        setErrorMessage(null);

        const timeoutId = window.setTimeout(() => {
            if (!socket || !isConnected) {
                void runRestFallback();
                return;
            }

            const payload: { input: string; options?: DecodeOptions } = {
                input: trimmedInput,
            };
            if (forcedDecoder) {
                payload.options = { forceDecoder: forcedDecoder };
            }

            socket.emit('decode:live', payload, (response: LiveDecodeResponse) => {
                if (cancelled) {
                    return;
                }
                if (!response.ok) {
                    void runRestFallback();
                    return;
                }

                setResult(response.result);
                setRequestState('success');
                setErrorMessage(null);
                setDecodeSource('live');
            });
        }, LIVE_DECODE_DELAY_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [input, socket, isConnected, forcedDecoder]);

    const isLoading = requestState === 'loading';
    const connectionLabel =
        status === 'connected'
            ? 'Live connected'
            : status === 'connecting'
              ? 'Connecting'
              : status === 'error'
                ? 'Connection error'
                : 'Offline';

    const connectionClassName = `connection-status connection-status--${status}`;
    return (
        <main className="decode-page">
            <section className="workspace-bar">
                <div>
                    <p className="decode-kicker">Workspace</p>
                    <h1 className="workspace-title">Decode</h1>
                </div>
                <div className="workspace-bar-right">
                    {decoders.length > 0 && (
                        <span className="workspace-stat">{decoders.length} decoders ready</span>
                    )}
                    <span className={connectionClassName}>{connectionLabel}</span>
                </div>
            </section>

            <section className="decode-shell">
                <div className="decode-panel glass-surface">
                    <div className="panel-header">
                        <div>
                            <h2>Input</h2>
                            <p className="panel-meta">
                                {isConnected
                                    ? 'Live decoding as you type'
                                    : 'Paste raw encoded text'}
                            </p>
                        </div>

                        <span className="char-count">{input.length} chars</span>
                    </div>

                    <div className="input-toolbar">
                        <button type="button" className="icon-btn" onClick={handlePasteInput}>
                            <ClipboardPaste size={13} />
                            Paste
                        </button>
                        <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setInput(SAMPLE_INPUT)}
                        >
                            <Sparkles size={13} />
                            Sample
                        </button>
                        <button
                            type="button"
                            className="icon-btn"
                            onClick={() => setInput('')}
                            disabled={!input}
                        >
                            <Eraser size={13} />
                            Clear
                        </button>
                    </div>

                    <textarea
                        rows={10}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                                event.preventDefault();
                                void handleDecode();
                            }
                        }}
                        placeholder="Paste Base64, Hex, JWT, URL-encoded, Morse, or any layered payload..."
                        aria-label="Encoded input"
                    />

                    <div className="decode-actions">
                        <label className="decoder-select-wrap">
                            <span className="decoder-select-label">Decoder</span>
                            <select
                                className="decoder-select"
                                value={forcedDecoder}
                                onChange={(event) => setForcedDecoder(event.target.value)}
                                aria-label="Force a specific decoder"
                            >
                                <option value="">Auto-detect</option>
                                {decoders.map((decoder) => (
                                    <option key={decoder.name} value={decoder.name}>
                                        {decoder.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <div className="decode-actions-right">
                            <span className="kbd-hint" aria-hidden="true">
                                <kbd>Ctrl</kbd>
                                <kbd>↵</kbd>
                            </span>
                            <button type="button" onClick={handleDecode} disabled={isLoading}>
                                {isLoading ? 'Decoding...' : 'Decode'}
                            </button>
                        </div>
                    </div>

                    {errorMessage && <p className="decode-error">{errorMessage}</p>}
                </div>

                <div className="result-panel glass-surface">
                    <div className="result-header">
                        <div>
                            <p className="result-kicker">Result</p>
                            <h2>Decoded output</h2>
                        </div>

                        {result && (
                            <div className="result-actions-wrapper">
                                {isAuthenticated && (
                                    <button
                                        type="button"
                                        onClick={handleShareWorkspaceResult}
                                        disabled={shareState === 'sharing'}
                                        className={`share-btn ${shareState === 'copied' ? 'share-btn--copied' : ''} ${shareState === 'error' ? 'share-btn--error' : ''}`}
                                        title="Share this decode result with a public link"
                                    >
                                        <Share2 size={13} />
                                        {shareState === 'sharing'
                                            ? 'Sharing...'
                                            : shareState === 'copied'
                                              ? 'Copied!'
                                              : shareState === 'error'
                                                ? 'Error!'
                                                : 'Share'}
                                    </button>
                                )}
                                <span className="result-badge">
                                    {result.steps.length}{' '}
                                    {result.steps.length === 1 ? 'step' : 'steps'}
                                </span>
                            </div>
                        )}
                    </div>

                    {requestState === 'loading' ? (
                        <div className="result-empty-card result-loading-card result-state">
                            <Loader2
                                className="result-state-icon result-state-icon--spin"
                                size={22}
                            />
                            <p className="result-empty">
                                Analyzing input and applying decode pipeline...
                            </p>
                        </div>
                    ) : requestState === 'error' ? (
                        <div className="result-empty-card result-error-card result-state">
                            <AlertTriangle
                                className="result-state-icon result-state-icon--error"
                                size={22}
                            />
                            <p className="result-empty">
                                Unable to decode this input right now. Check the format and try
                                again.
                            </p>
                        </div>
                    ) : requestState === 'idle' || !result ? (
                        <div className="result-empty-card result-state">
                            <ScanSearch className="result-state-icon" size={22} />
                            <p className="result-empty">
                                Paste or type on the left — decoded output and pipeline steps appear
                                here instantly.
                            </p>
                        </div>
                    ) : (
                        <>
                            {result.steps.length > 0 && (
                                <div className="encoder-chain">
                                    <span className="encoder-chain-label">Detected</span>
                                    {result.steps.map((step, index) => (
                                        <Fragment key={`${step.decoderName}-${index}`}>
                                            {index > 0 && (
                                                <span className="encoder-arrow" aria-hidden="true">
                                                    →
                                                </span>
                                            )}
                                            <span className="encoder-chip">{step.decoderName}</span>
                                        </Fragment>
                                    ))}
                                </div>
                            )}

                            <div className="result-grid">
                                <div className="result-block">
                                    <p className="block-label">Original Input</p>
                                    <pre>{result.originalInput}</pre>
                                </div>

                                <div className="result-block result-highlight">
                                    <div className="block-header">
                                        <p className="block-label">Final Output</p>
                                        <div className="block-actions">
                                            <button
                                                type="button"
                                                className="icon-btn"
                                                onClick={handleUseAsInput}
                                                title="Use this output as new input"
                                            >
                                                <CornerUpLeft size={13} />
                                                Use as input
                                            </button>
                                            <button
                                                type="button"
                                                className={`icon-btn ${copyState === 'copied' ? 'icon-btn--ok' : ''}`}
                                                onClick={handleCopyOutput}
                                                title="Copy decoded output"
                                            >
                                                {copyState === 'copied' ? (
                                                    <>
                                                        <Check size={13} />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy size={13} />
                                                        Copy
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    <pre>{result.finalOutput}</pre>
                                </div>
                            </div>

                            <div className="result-block">
                                <div className="steps-header">
                                    <h3>Pipeline Steps</h3>
                                    <p className="steps-meta">Step-by-step decoder output</p>
                                </div>
                                <DecodePipeline steps={result.steps} />
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
