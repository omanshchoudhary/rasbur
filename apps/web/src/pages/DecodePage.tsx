import { useState } from 'react';
import type { DecodeResult } from '@rasbur/shared';
import { api } from '@/services/api.js';

type RequestState = 'idle' | 'loading' | 'success' | 'error';

function getConfidenceTone(confidence: number): string {
    if (confidence >= 0.8) return 'confidence-high';
    if (confidence >= 0.5) return 'confidence-mid';
    return 'confidence-low';
}

export default function DecodePage() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<DecodeResult | null>(null);
    const [requestState, setRequestState] = useState<RequestState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    const isLoading = requestState === 'loading';

    return (
        <main className="decode-page">
            <section className="decode-hero">
                <p className="decode-kicker">Decode Workspace</p>
                <h1>Inspect an encoded string</h1>
                <p className="decode-subtitle">
                    Paste a value, run the decoder pipeline, and inspect each transformation step.
                </p>
            </section>

            <section className="decode-shell">
                <div className="decode-panel">
                    <div className="panel-header">
                        <h2>Input</h2>
                        <p className="panel-meta">Paste raw encoded text</p>
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

                <div className="result-panel">
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

                                {result.steps.length === 0 ? (
                                    <p className="result-empty-text">
                                        No decoding steps were applied.
                                    </p>
                                ) : (
                                    <ol className="steps-list">
                                        {result.steps.map((step, index) => (
                                            <li
                                                key={`${step.decoderName}-${index}`}
                                                className="step-card"
                                            >
                                                <div className="step-top">
                                                    <div className="step-title-group">
                                                        <span className="step-index">
                                                            Step {index + 1}
                                                        </span>
                                                        <strong>{step.decoderName}</strong>
                                                    </div>

                                                    <span
                                                        className={`confidence-chip ${getConfidenceTone(step.confidence)}`}
                                                    >
                                                        {step.confidence.toFixed(2)}
                                                    </span>
                                                </div>

                                                <div className="step-grid">
                                                    <div className="step-block">
                                                        <p className="block-label">Input</p>
                                                        <pre>{step.input}</pre>
                                                    </div>

                                                    <div className="step-block">
                                                        <p className="block-label">Output</p>
                                                        <pre>{step.output}</pre>
                                                    </div>
                                                </div>

                                                <div className="step-block">
                                                    <p className="block-label">Explanation</p>
                                                    <p className="step-copy">{step.explanation}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </main>
    );
}
