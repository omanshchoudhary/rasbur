import { useState } from 'react';
import type { DecodeResult } from '@rasbur/shared';
import { api } from '../services/api.js';

export default function DecodePage() {
    const [input, setInput] = useState('');
    const [result, setResult] = useState<DecodeResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleDecode() {
        if (!input.trim()) {
            setError('Please enter something to decode.');
            setResult(null);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            const decodeResult = await api.decode(input);
            setResult(decodeResult);
        } catch (err) {
            setError('Failed to decode input.');
            setResult(null);
        } finally {
            setIsLoading(false);
        }
    }
    return (
        <main>
            <h1>Decode</h1>
            <p>Paste an encoded string and decode it.</p>

            <textarea
                rows={8}
                cols={60}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Enter encoded text here..."
            ></textarea>

            <div>
                <button type="button" onClick={handleDecode} disabled={isLoading}>
                    {isLoading ? 'Decoding...' : 'Decode'}
                </button>
            </div>
            {error && <p>{error}</p>}
            {result && (
                <section>
                    <h2>Result</h2>
                    <p>
                        <strong>Original Input:</strong> {result.originalInput}
                    </p>
                    <p>
                        <strong>Final Output:</strong> {result.finalOutput}
                    </p>

                    <h3>Steps</h3>
                    {result.steps.length === 0 ? (
                        <p>No decoding steps were applied.</p>
                    ) : (
                        <ul>
                            {result.steps.map((step, index) => (
                                <li key={`${step.decoderName}-${index}`}>
                                    <strong>{step.decoderName}</strong> ({step.confidence})
                                    <div>Input: {step.input}</div>
                                    <div>Output: {step.output}</div>
                                    <div>Explanation: {step.explanation}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}
        </main>
    );
}
