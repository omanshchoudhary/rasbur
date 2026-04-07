import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api.js';

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
            <section className="home-hero glass-surface glass-surface--hero">
                <p className="home-kicker reveal-up stagger-1">Rasbur Platform</p>
                <h1 className="home-title reveal-up stagger-2">
                    Decode encoded strings with clear, step-by-step output.
                </h1>
                <p className="home-subtitle reveal-up stagger-3">
                    Identify likely formats, apply decoding layers, and inspect each transformation
                    in one workspace.
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

            <section className="home-section glass-surface reveal-up">
                <div className="home-section-head">
                    <p className="home-section-kicker">Use Cases</p>
                    <h2>Built for practical decoding workflows</h2>
                </div>

                <div className="home-feature-grid">
                    <article className="home-feature-card">
                        <p className="home-feature-kicker">Analysis</p>
                        <h3>Unknown input inspection</h3>
                        <p>Identify likely encoding formats before applying decode steps.</p>
                    </article>

                    <article className="home-feature-card">
                        <p className="home-feature-kicker">Reliability</p>
                        <h3>Step-by-step traceability</h3>
                        <p>
                            Review each decode step with input, output, confidence, and explanation.
                        </p>
                    </article>

                    <article className="home-feature-card">
                        <p className="home-feature-kicker">Speed</p>
                        <h3>Faster troubleshooting</h3>
                        <p>Reduce trial-and-error when debugging encoded payloads.</p>
                    </article>
                </div>
            </section>

            <section className="home-section glass-surface reveal-up">
                <div className="home-section-head">
                    <p className="home-section-kicker">How It Works</p>
                    <h2>Paste → Analyze → Decode → Use</h2>
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
                        <h3>Use</h3>
                        <p>Use final output and step trace in your workflow.</p>
                    </li>
                </ol>
            </section>

            <section className="home-section glass-surface reveal-up">
                <div className="home-section-head">
                    <p className="home-section-kicker">Current Status</p>
                    <h2>What is available now</h2>
                </div>

                <div className="home-trust-row">
                    <div className="home-trust-item">
                        <strong>18+ decoders</strong>
                        <p>Available in the current engine.</p>
                    </div>
                    <div className="home-trust-item is-muted">
                        <strong>More platform modules</strong>
                        <p>Planned as upcoming backend milestones are completed.</p>
                    </div>
                    <div className="home-trust-item is-muted">
                        <strong>Expanded product features</strong>
                        <p>Scheduled for upcoming release phases.</p>
                    </div>
                </div>
            </section>

            <section className="home-final-cta glass-surface glass-surface--strong reveal-up">
                <h2>Inspect payloads with full step visibility.</h2>
                <p>Use the decode workspace to analyze inputs with clear context.</p>
                <Link className="home-cta-primary" to="/decode">
                    Open Decode Workspace
                </Link>
            </section>
        </main>
    );
}
