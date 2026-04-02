import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';

export default function HomePage() {
    const [decoderCount, setDecoderCount] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDecoders() {
            try {
                const decoders = await api.getDecoders();
                setDecoderCount(decoders.length);
            } catch (err) {
                setError('Failed to load decoders');
            }
        }
        void loadDecoders();
    }, []);
    return (
        <main className="home-page">
            <section className="home-hero">
                <p className="home-kicker reveal-up stagger-1">Rasbur Platform</p>
                <h1 className="home-title reveal-up stagger-2">
                    The decoder that identifies, unwraps, and explains.
                </h1>
                <p className="home-subtitle reveal-up stagger-3">
                    Stop guessing encodings. Let Rasbur decode it with a clear, step-by-step output.
                </p>

                <div className="home-cta-row reveal-up stagger-4">
                    <Link className="home-cta-primary" to="/decode">
                        Open Decode Workspace
                    </Link>
                    <a className="home-cta-secondary" href="/docs" target="_blank" rel="noreferrer">
                        Read Documentation
                    </a>
                </div>

                <div className="home-signal-row reveal-up stagger-5">
                    <span>18+ decoders</span>
                    <span>Smart detection</span>
                    <span>Multi-layer pipeline</span>
                    <span>Step-by-step breakdown</span>
                </div>

                <div className="home-meta-row reveal-up stagger-6">
                    {decoderCount !== null && <p>Live decoder registry: {decoderCount}</p>}
                    {error && <p>{error}</p>}
                </div>
            </section>

            <section className="home-section reveal-up">
                <div className="home-section-head">
                    <p className="home-section-kicker">Use Cases</p>
                    <h2>Built for real decoding workflows</h2>
                </div>

                <div className="home-feature-grid">
                    <article className="home-feature-card">
                        <p className="home-feature-kicker">Analysis</p>
                        <h3>Unknown input inspection</h3>
                        <p>Identify likely encoding formats before applying transforms.</p>
                    </article>

                    <article className="home-feature-card">
                        <p className="home-feature-kicker">Reliability</p>
                        <h3>Step-by-step traceability</h3>
                        <p>Review each decode step with input, output, and explanation.</p>
                    </article>

                    <article className="home-feature-card">
                        <p className="home-feature-kicker">Speed</p>
                        <h3>Faster troubleshooting</h3>
                        <p>Reduce trial-and-error when handling encoded payloads.</p>
                    </article>
                </div>
            </section>

            <section className="home-section reveal-up">
                <div className="home-section-head">
                    <p className="home-section-kicker">How It Works</p>
                    <h2>Paste → Analyze → Transform → Export</h2>
                </div>

                <ol className="home-steps-grid">
                    <li>
                        <span>01</span>
                        <h3>Paste</h3>
                        <p>Submit encoded or obfuscated input.</p>
                    </li>
                    <li>
                        <span>02</span>
                        <h3>Analyze</h3>
                        <p>Rasbur ranks likely formats and decoding paths.</p>
                    </li>
                    <li>
                        <span>03</span>
                        <h3>Transform</h3>
                        <p>Pipeline applies decoding steps with confidence context.</p>
                    </li>
                    <li>
                        <span>04</span>
                        <h3>Export</h3>
                        <p>Use final output and step trace for downstream workflows.</p>
                    </li>
                </ol>
            </section>

            <section className="home-section reveal-up">
                <div className="home-section-head">
                    <p className="home-section-kicker">Current Status</p>
                    <h2>What is ready now</h2>
                </div>

                <div className="home-trust-row">
                    <div className="home-trust-item">
                        <strong>18+ decoders support</strong>
                        <p>Active and available in the current engine.</p>
                    </div>
                    <div className="home-trust-item is-muted">
                        <strong>More platform modules</strong>
                        <p>Coming soon as backend milestones are completed.</p>
                    </div>
                    <div className="home-trust-item is-muted">
                        <strong>Expanded product features</strong>
                        <p>Planned for upcoming release phases.</p>
                    </div>
                </div>
            </section>

            <section className="home-final-cta reveal-up">
                <h2>Inspect payloads with full step visibility.</h2>
                <p>Use the decode workspace to analyze inputs without losing context.</p>
                <Link className="home-cta-primary" to="/decode">
                    Open Decode Workspace
                </Link>
            </section>
        </main>
    );
}
