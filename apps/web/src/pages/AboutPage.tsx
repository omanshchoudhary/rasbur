import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Radio, Terminal, Share2, GitCompareArrows, KeyRound } from 'lucide-react';
import { api } from '@/services/api.js';
import { useScrollReveal } from '@/hooks/useScrollReveal.js';

const CAPABILITIES = [
    {
        icon: Layers,
        title: 'Multi-layer pipeline',
        body: 'Stacked encodings are unwrapped one layer at a time, each with its own confidence score.',
    },
    {
        icon: Radio,
        title: 'Live decoding',
        body: 'Results update as you type over a WebSocket connection, with a REST fallback.',
    },
    {
        icon: Terminal,
        title: 'REST API',
        body: 'The same pipeline is callable from your own code, authenticated with scoped keys.',
    },
    {
        icon: Share2,
        title: 'Shareable results',
        body: 'Turn any decode into a public link with the full pipeline attached. Links expire on their own.',
    },
    {
        icon: GitCompareArrows,
        title: 'Side-by-side compare',
        body: 'Decode two payloads at once with a character-level diff of the outputs.',
    },
    {
        icon: KeyRound,
        title: 'API keys & limits',
        body: 'Issue scoped keys, track usage per key, and stay inside clear daily rate limits.',
    },
];

const STACK = ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'Redis', 'WebSocket'];

export default function AboutPage() {
    useScrollReveal();
    const [decoderCount, setDecoderCount] = useState<number | null>(null);

    useEffect(() => {
        let active = true;
        api.getDecoders()
            .then((list) => {
                if (active) setDecoderCount(list.length);
            })
            .catch(() => {
                /* count is non-critical */
            });
        return () => {
            active = false;
        };
    }, []);

    return (
        <main className="about-page bg-cyber-grid relative min-h-screen px-4 py-12 md:py-20 mx-auto max-w-4xl">
            <div className="aura-container">
                <div className="aura-blob aura-blob--purple" />
                <div className="aura-blob aura-blob--teal" />
            </div>

            <div className="relative z-10 text-left">
                {/* Hero */}
                <header className="reveal-on-scroll mb-16">
                    <span className="cyber-badge mb-6">About Rasbur</span>
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">
                        Decoding shouldn&apos;t be a{' '}
                        <span className="text-glow-gradient">guessing game.</span>
                    </h1>
                    <p className="text-neutral-400 text-base md:text-lg leading-relaxed max-w-2xl mb-8">
                        Rasbur takes an encoded string — Base64, hex, a JWT, Morse, a cipher, or
                        several layers stacked together — figures out what it is, peels it apart
                        layer by layer, and shows you every step. It&apos;s free, open source, and
                        currently in beta.
                    </p>

                    {/* Signature: the brand name is literally itself, in hex */}
                    <div className="inline-flex flex-col gap-1.5">
                        <div className="font-mono text-sm md:text-base bg-black/40 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap">
                            <span className="text-cyan-400">52 61 73 62 75 72</span>
                            <span className="text-neutral-600">→</span>
                            <span className="text-white font-bold">Rasbur</span>
                        </div>
                        <span className="font-mono text-[11px] text-neutral-500 pl-1">
                            yes — the name is its own hex payload.
                        </span>
                    </div>
                </header>

                {/* Why it exists */}
                <section className="reveal-on-scroll glow-card rounded-3xl border border-white/5 bg-neutral-950/40 p-6 md:p-8 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-3">Why it exists</h2>
                    <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                        Reverse-engineering an unknown payload usually means a browser full of
                        single-purpose decoders and a lot of trial and error: try Base64, paste the
                        result into a hex decoder, realise it&apos;s actually a JWT, start over.
                        Rasbur runs that loop for you — it tries every decoder, scores the results,
                        and follows the most promising chain on its own.
                    </p>
                </section>

                {/* How it decides */}
                <section className="reveal-on-scroll glow-card rounded-3xl border border-white/5 bg-neutral-950/40 p-6 md:p-8 mb-6">
                    <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                                How it decides what&apos;s real
                            </h2>
                            <p className="text-neutral-400 text-sm md:text-base leading-relaxed">
                                Most tools only check whether the input <em>looks</em> like a given
                                format. Rasbur also scores the decoded <em>output</em> — using
                                English letter frequency, byte patterns, and structure — so it can
                                tell a genuine decode from plausible-looking garbage. Every step
                                carries a confidence score you can see.
                            </p>
                        </div>

                        {/* Mini pipeline widget */}
                        <div className="bento-widget select-none shrink-0 md:w-64 font-mono">
                            <div className="bento-widget-header">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Pipeline</span>
                            </div>
                            <div className="flex flex-col gap-2 text-[11px]">
                                <div className="flex items-center gap-2">
                                    <span className="text-neutral-200">Base64</span>
                                    <span className="text-emerald-400 ml-auto font-bold">0.95</span>
                                </div>
                                <div className="text-neutral-600 pl-1">↓</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-neutral-200">Hex</span>
                                    <span className="text-emerald-400 ml-auto font-bold">0.98</span>
                                </div>
                                <div className="text-neutral-600 pl-1">↓</div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-bold">Hello Rasbur</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* What you can do */}
                <section className="reveal-on-scroll mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-5 px-1">
                        What you can do with it
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                            <div
                                key={title}
                                className="rounded-2xl border border-white/5 bg-neutral-950/40 p-5 flex gap-4"
                            >
                                <div className="glow-card-icon-wrapper glow-card-icon-wrapper--blue shrink-0">
                                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                                    <p className="text-neutral-400 text-xs leading-relaxed">
                                        {body}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Open and honest */}
                <section className="reveal-on-scroll glow-card rounded-3xl border border-white/5 bg-neutral-950/40 p-6 md:p-8 mb-6">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
                        Open, free, and honest
                    </h2>
                    <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-4">
                        Rasbur is open source under the MIT license and free to use. It&apos;s in
                        active beta, built and maintained by one developer — so things may change,
                        and feedback genuinely shapes what gets built next. No paid tiers, no
                        upsells, and no invented numbers on this page.
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        <a
                            className="text-neutral-300 hover:text-white underline underline-offset-2"
                            href="https://github.com/omanshchoudhary/rasbur"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Source on GitHub
                        </a>
                        <a
                            className="text-neutral-300 hover:text-white underline underline-offset-2"
                            href="https://github.com/omanshchoudhary/rasbur/blob/main/LICENSE"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            MIT License
                        </a>
                        <a
                            className="text-neutral-300 hover:text-white underline underline-offset-2"
                            href="https://github.com/omanshchoudhary/rasbur/issues"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Report an issue
                        </a>
                    </div>
                </section>

                {/* Built with */}
                <section className="reveal-on-scroll mb-16">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-1">
                        Built with
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {STACK.map((tech) => (
                            <span
                                key={tech}
                                className="font-mono text-xs text-neutral-300 border border-white/10 bg-white/5 rounded-full px-3 py-1.5"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className="reveal-on-scroll text-center border-t border-white/5 pt-12">
                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                        Try it on your own string
                    </h2>
                    <p className="text-neutral-500 text-sm mb-7">
                        {decoderCount !== null
                            ? `${decoderCount} decoders across base, cipher, and structured formats.`
                            : 'Paste something in and watch every layer come apart.'}
                    </p>
                    <Link
                        className="cta-pulse-btn px-8 py-3.5 rounded-full text-base font-bold transition-all duration-300"
                        to="/decode"
                    >
                        Open the workspace
                    </Link>
                </section>
            </div>
        </main>
    );
}
