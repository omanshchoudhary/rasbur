import { useState, useEffect } from 'react';
import type { DecodeResult, DecodeOptions } from '@rasbur/shared';
import { api } from '@/services/api.js';
import DecodePipeline from '@/components/DecodePipeline.js';
import { useWebSocket } from '@/hooks/useWebSocket.js';

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

export default function DecodePage() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<DecodeResult | null>(null);
    const [requestState, setRequestState] = useState<RequestState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { socket, status, isConnected } = useWebSocket();

    async function handleDecode() {
        if (!input.trim()) {
            setRequestState('error');
            setErrorMessage('Please enter something to decode.');
            setResult(null);
            return;
        }

        try {
            setRequestState('loading');
            setErrorMessage(null);
            setResult(null);

            const decodeResult = await api.decode(input);
            setResult(decodeResult);
            setRequestState('success');
        } catch (err) {
            setRequestState('error');
            setErrorMessage('Failed to decode input.');
            setResult(null);
        }
    }

    useEffect(() => {
        if (!socket || !isConnected) {
            return;
        }

        const trimmedInput = input.trim();

        if (!trimmedInput) {
            setResult(null);
            setRequestState('idle');
            setErrorMessage(null);
            return;
        }

        setRequestState('loading');
        setErrorMessage(null);

        const timeoutId = window.setTimeout(() => {
            const payload: { input: string; options?: DecodeOptions } = {
                input: trimmedInput,
            };

            socket.emit('decode:live', payload, (response: LiveDecodeResponse) => {
                if (!response.ok) {
                    setRequestState('error');
                    setErrorMessage(response.error);
                    return;
                }

                setResult(response.result);
                setRequestState('success');
                setErrorMessage(null);
            });
        }, LIVE_DECODE_DELAY_MS);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [input, socket, isConnected]);

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
            <section className="decode-hero">
                <p className="decode-kicker">Decode Workspace</p>
                <h1>Inspect encoded input with full step context</h1>
                <p className="decode-subtitle">
                    Paste input, run the decode pipeline, and review each transformation clearly.
                </p>
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

                        <span className={connectionClassName}>{connectionLabel}</span>
                    </div>

                    <textarea
                        rows={10}
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Enter encoded text here..."
                    />

                    <div className="decode-actions">
                        <button type="button" onClick={handleDecode} disabled={isLoading}>
                            {isLoading ? 'Decoding...' : 'Decode'}
                        </button>
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
                            <span className="result-badge">
                                {result.steps.length} {result.steps.length === 1 ? 'step' : 'steps'}
                            </span>
                        )}
                    </div>

                    {requestState === 'loading' ? (
                        <div className="result-empty-card result-loading-card">
                            <p className="result-empty">
                                Analyzing input and applying decode pipeline...
                            </p>
                        </div>
                    ) : requestState === 'error' ? (
                        <div className="result-empty-card result-error-card">
                            <p className="result-empty">
                                Unable to decode this input right now. Check the format and try
                                again.
                            </p>
                        </div>
                    ) : requestState === 'idle' || !result ? (
                        <div className="result-empty-card">
                            <p className="result-empty">
                                Run a decode request to see the output and pipeline steps here.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="result-grid">
                                <div className="result-block">
                                    <p className="block-label">Original Input</p>
                                    <pre>{result.originalInput}</pre>
                                </div>

                                <div className="result-block result-highlight">
                                    <p className="block-label">Final Output</p>
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
