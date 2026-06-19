import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Preset, DemoStep } from '@rasbur/shared';
import { api } from '@/services/api.js';
import { useScrollReveal } from '@/hooks/useScrollReveal.js';
import {
    Layers,
    Cpu,
    Radio,
    Terminal,
    Clipboard,
    Search,
    Code,
    Share2,
    GitCompareArrows,
    KeyRound,
} from 'lucide-react';

const PRESETS: Preset[] = [
    {
        id: 'hex',
        label: 'Hex Payload',
        value: '52617362757220697320616e20616d617a696e672053616153',
    },
    {
        id: 'jwt',
        label: 'JWT Token',
        value: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    },
    {
        id: 'base64',
        label: 'Base64 JSON',
        value: 'eyJrZXkiOiJzYWFzLWRlbW8iLCJ1c2VyIjoicmFzYnVyLWFkbWluIiwic3RhdHVzIjoiYWN0aXZlIn0=',
    },
    {
        id: 'morse',
        label: 'Morse Code',
        value: '.-. .- ... -... ..- .-. / -.. . -.-. --- -.. . ...',
    },
];

function isMostlyPrintable(text: string): boolean {
    if (!text) return false;
    let printable = 0;
    for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i);
        if (code === 9 || code === 10 || code === 13 || (code >= 32 && code < 127)) {
            printable++;
        }
    }
    return printable / text.length >= 0.9;
}

function prettyIfJson(text: string): string {
    try {
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null) {
            return JSON.stringify(parsed, null, 2);
        }
    } catch {
        // not JSON, return as-is
    }
    return text;
}

function decodeLocal(input: string): { steps: DemoStep[]; output: string } {
    const trimmed = input.trim();
    if (!trimmed) {
        return { steps: [], output: '' };
    }

    if (trimmed.split('.').length === 3) {
        const parts = trimmed.split('.');
        const p0 = parts[0];
        const p1 = parts[1];
        if (p0 !== undefined && p1 !== undefined) {
            try {
                const decodeB64Url = (str: string) => {
                    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) {
                        base64 += '=';
                    }
                    return decodeURIComponent(
                        atob(base64)
                            .split('')
                            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                            .join('')
                    );
                };
                const header = decodeB64Url(p0);
                const payload = decodeB64Url(p1);
                return {
                    steps: [
                        { name: 'JWT Splitter', confidence: 1.0, output: 'Parts Separated' },
                        { name: 'Base64URL Header', confidence: 1.0, output: 'JSON Metadata' },
                        { name: 'Base64URL Payload', confidence: 1.0, output: 'JSON Payload' },
                    ],
                    output: prettyIfJson(payload),
                };
            } catch {
                // failed to parse as JWT
            }
        }
    }

    if (/^[0-9a-fA-F\s]+$/.test(trimmed) && trimmed.length >= 4) {
        const clean = trimmed.replace(/\s+/g, '');
        if (clean.length % 2 === 0) {
            try {
                let out = '';
                for (let i = 0; i < clean.length; i += 2) {
                    out += String.fromCharCode(parseInt(clean.substring(i, i + 2), 16));
                }
                if (isMostlyPrintable(out)) {
                    return {
                        steps: [{ name: 'Hexadecimal', confidence: 1.0, output: 'Plaintext' }],
                        output: prettyIfJson(out),
                    };
                }
            } catch {
                // failed to parse as Hex
            }
        }
    }

    if (/^[.\-\/\s]+$/.test(trimmed)) {
        const morseMap: Record<string, string> = {
            '.-': 'A',
            '-...': 'B',
            '-.-.': 'C',
            '-..': 'D',
            '.': 'E',
            '..-.': 'F',
            '--.': 'G',
            '....': 'H',
            '..': 'I',
            '.---': 'J',
            '-.-': 'K',
            '.-..': 'L',
            '--': 'M',
            '-.': 'N',
            '---': 'O',
            '.--.': 'P',
            '--.-': 'Q',
            '.-.': 'R',
            '...': 'S',
            '-': 'T',
            '..-': 'U',
            '...-': 'V',
            '.--': 'W',
            '-..-': 'X',
            '-.--': 'Y',
            '--..': 'Z',
            '-----': '0',
            '.----': '1',
            '..---': '2',
            '...--': '3',
            '....-': '4',
            '.....': '5',
            '-....': '6',
            '--...': '7',
            '---..': '8',
            '----.': '9',
            '/': ' ',
        };
        try {
            const out = trimmed
                .split(/\s+/)
                .map((char) => morseMap[char] || '')
                .join('');
            if (out.trim().length > 0) {
                return {
                    steps: [{ name: 'Morse Code', confidence: 1.0, output: 'Plaintext' }],
                    output: out,
                };
            }
        } catch {
            // failed to parse as Morse
        }
    }

    try {
        if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length % 4 === 0 && trimmed.length >= 8) {
            const decoded = atob(trimmed);
            if (isMostlyPrintable(decoded)) {
                return {
                    steps: [{ name: 'Base64', confidence: 1.0, output: 'Plaintext' }],
                    output: prettyIfJson(decoded),
                };
            }
        }
    } catch {
        // failed to parse as Base64
    }

    return {
        steps: [{ name: 'String Recognizer', confidence: 0.85, output: 'Plaintext' }],
        output: trimmed,
    };
}

function detectHighlightKind(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) return 'custom';
    if (/^[.\-/\s]+$/.test(trimmed)) return 'morse';
    if (/^[\w-]+\.[\w-]+\.[\w-]*$/.test(trimmed)) return 'jwt';
    if (/^(0x)?[0-9a-fA-F\s]+$/.test(trimmed)) return 'hex';
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) return 'base64';
    return 'custom';
}

function highlightTerminalText(text: string, presetId: string, showCursor: boolean) {
    if (!text) {
        return showCursor ? <span className="terminal-cursor-block" /> : null;
    }

    const elements: React.ReactNode[] = [];

    if (presetId === 'jwt') {
        const parts = text.split('.');
        parts.forEach((part, index) => {
            if (index === 0) {
                elements.push(
                    <span key={`jwt-header-${index}`} style={{ color: '#00E5FF' }}>
                        {part}
                    </span>
                );
            } else if (index === 1) {
                elements.push(
                    <span key={`jwt-payload-${index}`} style={{ color: '#00FF66' }}>
                        {part}
                    </span>
                );
            } else if (index === 2) {
                elements.push(
                    <span key={`jwt-signature-${index}`} style={{ color: '#0066FF' }}>
                        {part}
                    </span>
                );
            } else {
                elements.push(
                    <span key={`jwt-extra-${index}`} style={{ color: '#888888' }}>
                        {part}
                    </span>
                );
            }

            if (index < parts.length - 1) {
                elements.push(
                    <span key={`jwt-dot-${index}`} style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                        .
                    </span>
                );
            }
        });
    } else if (presetId === 'hex') {
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === undefined) continue;
            if (/[0-9]/.test(char)) {
                elements.push(
                    <span key={`hex-${i}`} style={{ color: '#00FF66' }}>
                        {char}
                    </span>
                );
            } else if (/[a-fA-F]/.test(char)) {
                elements.push(
                    <span key={`hex-${i}`} style={{ color: '#00E5FF' }}>
                        {char}
                    </span>
                );
            } else {
                elements.push(
                    <span key={`hex-${i}`} style={{ color: '#0066FF' }}>
                        {char}
                    </span>
                );
            }
        }
    } else if (presetId === 'base64') {
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === undefined) continue;
            if (/[A-Z]/.test(char)) {
                elements.push(
                    <span key={`b64-${i}`} style={{ color: '#00E5FF' }}>
                        {char}
                    </span>
                );
            } else if (/[a-z]/.test(char)) {
                elements.push(
                    <span key={`b64-${i}`} style={{ color: '#00FF66' }}>
                        {char}
                    </span>
                );
            } else if (/[0-9]/.test(char) || char === '+' || char === '/' || char === '=') {
                elements.push(
                    <span key={`b64-${i}`} style={{ color: '#0066FF' }}>
                        {char}
                    </span>
                );
            } else {
                elements.push(
                    <span key={`b64-${i}`} style={{ color: '#FFFFFF' }}>
                        {char}
                    </span>
                );
            }
        }
    } else if (presetId === 'morse') {
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === undefined) continue;
            if (char === '.') {
                elements.push(
                    <span key={`morse-${i}`} style={{ color: '#00E5FF', fontWeight: 'bold' }}>
                        {char}
                    </span>
                );
            } else if (char === '-') {
                elements.push(
                    <span key={`morse-${i}`} style={{ color: '#00FF66', fontWeight: 'bold' }}>
                        {char}
                    </span>
                );
            } else if (char === '/' || char === ' ') {
                elements.push(
                    <span key={`morse-${i}`} style={{ color: '#0066FF', fontWeight: 'bold' }}>
                        {char}
                    </span>
                );
            } else {
                elements.push(
                    <span key={`morse-${i}`} style={{ color: '#FFFFFF' }}>
                        {char}
                    </span>
                );
            }
        }
    } else {
        const tokens = text.split(/([{}":,\[\]\s]+|[0-9]+|[a-zA-Z]+|[^a-zA-Z0-9{}":,\[\]\s]+)/g);
        tokens.forEach((token, i) => {
            if (!token) return;
            if (/^[0-9]+$/.test(token)) {
                elements.push(
                    <span key={`custom-${i}`} style={{ color: '#00E5FF' }}>
                        {token}
                    </span>
                );
            } else if (/^[a-zA-Z]+$/.test(token)) {
                elements.push(
                    <span key={`custom-${i}`} style={{ color: '#00FF66' }}>
                        {token}
                    </span>
                );
            } else if (/^[{}":,\[\]]+$/.test(token)) {
                elements.push(
                    <span key={`custom-${i}`} style={{ color: '#0066FF' }}>
                        {token}
                    </span>
                );
            } else {
                elements.push(
                    <span key={`custom-${i}`} style={{ color: '#FFFFFF' }}>
                        {token}
                    </span>
                );
            }
        });
    }

    if (showCursor) {
        elements.push(<span key="cursor" className="terminal-cursor-block" />);
    }

    return <>{elements}</>;
}

export default function HomePage() {
    const [decoderCount, setDecoderCount] = useState<number | null>(null);
    const [activePreset, setActivePreset] = useState<string>('hex');
    const [demoInput, setDemoInput] = useState<string>('');
    const [demoResult, setDemoResult] = useState<{ steps: DemoStep[]; output: string }>({
        steps: [],
        output: '',
    });
    const [isAutoTyping, setIsAutoTyping] = useState(true);
    const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
    const overlayRef = useRef<HTMLDivElement>(null);

    const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    };

    const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
    const [isHoveringWorkflow, setIsHoveringWorkflow] = useState(false);

    useEffect(() => {
        if (isHoveringWorkflow) return;
        const interval = setInterval(() => {
            setActiveWorkflowStep((prev) => (prev + 1) % 3);
        }, 3500);
        return () => clearInterval(interval);
    }, [isHoveringWorkflow]);

    useScrollReveal();

    useEffect(() => {
        async function loadDecoders() {
            try {
                const decoders = await api.getDecoders();
                setDecoderCount(decoders.length);
            } catch (err) {
                // error loading decoders
            }
        }
        void loadDecoders();
    }, []);

    useEffect(() => {
        if (!isAutoTyping) return;
        const defaultSample = PRESETS[0]?.value || '';
        let currentIndex = 0;
        setDemoInput('');

        const timer = setInterval(() => {
            currentIndex++;
            if (currentIndex >= defaultSample.length) {
                clearInterval(timer);
                setIsAutoTyping(false);
            }
            setDemoInput(defaultSample.slice(0, currentIndex));
        }, 12);

        return () => {
            clearInterval(timer);
        };
    }, [isAutoTyping]);

    useEffect(() => {
        setDemoResult(decodeLocal(demoInput));
        setActiveStepIndex(0);
    }, [demoInput]);

    function selectPreset(preset: Preset) {
        setIsAutoTyping(false);
        setActivePreset(preset.id);
        setDemoInput(preset.value);
    }

    return (
        <main className="home-page bg-cyber-grid relative min-h-screen px-4 py-12 md:py-20 mx-auto max-w-7xl">
            <div className="aura-container">
                <div className="aura-blob aura-blob--purple" />
                <div className="aura-blob aura-blob--teal" />
            </div>
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16 relative z-10">
                <div className="lg:col-span-7 flex flex-col text-left reveal-on-scroll">
                    <div className="flex items-center gap-2.5 mb-5 font-mono text-xs tracking-wider">
                        <span className="flex items-center gap-2 text-neutral-400">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0066FF] opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#0066FF]"></span>
                            </span>
                            Now in Beta
                        </span>
                    </div>
                    <h1 className="home-title">
                        String Obfuscation <span className="text-glow-gradient">Decoded.</span>
                    </h1>
                    <p className="home-subtitle">
                        Paste an encoded string and Rasbur detects the format, peels back each
                        layer, and shows exactly how it was built. Made for developers, CTF players,
                        and security researchers.
                    </p>

                    <div className="home-cta-row">
                        <Link className="home-cta-primary" to="/decode">
                            Start Decoding
                        </Link>
                        <a
                            className="home-cta-secondary"
                            href="/docs"
                            target="_blank"
                            rel="noreferrer"
                        >
                            View Docs
                        </a>
                    </div>

                    <div className="home-meta-row">
                        <div className="home-meta-item">
                            <span className="home-meta-dot" />
                            <span>
                                {decoderCount !== null
                                    ? `${decoderCount} decoders`
                                    : '18+ decoders'}
                            </span>
                        </div>
                        <div className="home-meta-item">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <span>WebSocket live</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-5 relative reveal-on-scroll stagger-1">
                    <div className="interactive-demo-card p-6 md:p-8">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                            <div className="flex gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] opacity-80" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] opacity-80" />
                                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] opacity-80" />
                            </div>
                            <span className="text-[10px] font-mono tracking-widest text-neutral-400 uppercase">
                                interactive-sandbox.sh
                            </span>
                            <div className="w-12" />
                        </div>

                        <div className="preset-pills-row">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    onClick={() => selectPreset(preset)}
                                    className={`preset-pill ${
                                        activePreset === preset.id ? 'is-active' : ''
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="demo-textarea-container">
                            <textarea
                                className="demo-textarea"
                                aria-label="Encoded string to decode"
                                value={demoInput}
                                onChange={(e) => {
                                    setIsAutoTyping(false);
                                    setActivePreset('custom');
                                    setDemoInput(e.target.value);
                                }}
                                onScroll={(e) => {
                                    if (overlayRef.current) {
                                        overlayRef.current.scrollTop = e.currentTarget.scrollTop;
                                        overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
                                    }
                                }}
                                placeholder="Paste your encoded string here..."
                            />
                            <div
                                className="demo-textarea-overlay"
                                ref={overlayRef}
                                id="demo-textarea-overlay"
                            >
                                {highlightTerminalText(
                                    demoInput,
                                    detectHighlightKind(demoInput),
                                    isAutoTyping
                                )}
                            </div>
                        </div>

                        <div className="demo-results-container">
                            <div className="demo-result-header">
                                <span className="demo-result-title">Analyzed Transformations</span>
                                {demoResult.steps.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        {demoResult.steps.length > 1 && (
                                            <div className="demo-step-paginator">
                                                <button
                                                    type="button"
                                                    disabled={activeStepIndex === 0}
                                                    onClick={() =>
                                                        setActiveStepIndex((prev) =>
                                                            Math.max(0, prev - 1)
                                                        )
                                                    }
                                                    className="demo-paginator-btn"
                                                    title="Previous Step"
                                                >
                                                    <svg
                                                        className="w-3 h-3"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M15.75 19.5L8.25 12l7.5-7.5"
                                                        />
                                                    </svg>
                                                </button>
                                                <span className="demo-paginator-info">
                                                    Step {activeStepIndex + 1} of{' '}
                                                    {demoResult.steps.length}
                                                </span>
                                                <button
                                                    type="button"
                                                    disabled={
                                                        activeStepIndex ===
                                                        demoResult.steps.length - 1
                                                    }
                                                    onClick={() =>
                                                        setActiveStepIndex((prev) =>
                                                            Math.min(
                                                                demoResult.steps.length - 1,
                                                                prev + 1
                                                            )
                                                        )
                                                    }
                                                    className="demo-paginator-btn"
                                                    title="Next Step"
                                                >
                                                    <svg
                                                        className="w-3 h-3"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2.5"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            d="M8.25 4.5l7.5 7.5-7.5 7.5"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                        <span className="demo-result-badge">
                                            {demoResult.steps.length}{' '}
                                            {demoResult.steps.length === 1 ? 'step' : 'steps'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {demoResult.steps.length === 0 ? (
                                <div className="demo-results-empty">
                                    Type something to start decoding pipeline simulation...
                                </div>
                            ) : (
                                <div className="demo-results-active-content">
                                    <div className="demo-pipeline-flow">
                                        {demoResult.steps[activeStepIndex] && (
                                            <div className="demo-pipeline-step-wrapper">
                                                <div className="demo-pipeline-step">
                                                    <span className="demo-step-badge">
                                                        {demoResult.steps[activeStepIndex].name}
                                                    </span>
                                                    <span className="demo-step-arrow">→</span>
                                                    <span className="demo-step-text">
                                                        {demoResult.steps[activeStepIndex].output}
                                                    </span>
                                                </div>
                                                <div className="demo-step-confidence-container">
                                                    <div className="demo-step-confidence-header">
                                                        <span className="demo-step-confidence-label">
                                                            Confidence Rating
                                                        </span>
                                                        <span className="demo-step-confidence-value">
                                                            {Math.round(
                                                                demoResult.steps[activeStepIndex]
                                                                    .confidence * 100
                                                            )}
                                                            %
                                                        </span>
                                                    </div>
                                                    <div className="demo-step-confidence-bar-bg">
                                                        <div
                                                            className="demo-step-confidence-bar-fill"
                                                            style={{
                                                                width: `${demoResult.steps[activeStepIndex].confidence * 100}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="demo-block">
                                        <p className="demo-block-label">Final Output</p>
                                        <div className="demo-block-content">
                                            {demoResult.output}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="mb-24 relative z-10">
                <div className="text-center mb-16 reveal-on-scroll">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                        What Rasbur does
                    </h2>
                    <p className="text-neutral-400 max-w-xl mx-auto">
                        One workspace to detect, decode, compare, and automate string analysis.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Multi-layer Pipeline (Spans 2 columns) */}
                    <div
                        className="glow-card p-6 md:col-span-2 rounded-3xl border border-white/5 bg-neutral-950/40 text-left reveal-on-scroll stagger-1 flex flex-col justify-between"
                        onMouseMove={handleCardMouseMove}
                    >
                        <div className="glow-card-glow" />
                        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center w-full">
                            <div className="flex-1">
                                <div className="glow-card-icon-wrapper glow-card-icon-wrapper--purple">
                                    <Layers className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Multi-layer Pipeline
                                </h3>
                                <p className="text-neutral-400 text-xs leading-relaxed max-w-md">
                                    Sequentially apply decoders. View progress, layers, and
                                    confidence scores at each step.
                                </p>
                            </div>

                            {/* Visual Layer Widget */}
                            <div className="bento-widget select-none shrink-0 self-stretch md:self-auto flex flex-col justify-between">
                                <div className="bento-widget-header">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                    <span>Pipeline layers</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 text-[9px]">
                                            01
                                        </span>
                                        <span className="text-neutral-200">Base64 Decode</span>
                                        <span className="text-purple-400 ml-auto font-bold font-mono">
                                            100%
                                        </span>
                                    </div>
                                    <div className="text-neutral-600 pl-4 font-mono text-[9px] leading-3">
                                        ↓
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-1 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 text-[9px]">
                                            02
                                        </span>
                                        <span className="text-neutral-200">Hex Payload</span>
                                        <span className="text-cyan-400 ml-auto font-bold font-mono">
                                            98%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Auto-detection (Spans 1 column) */}
                    <div
                        className="glow-card p-6 md:col-span-1 rounded-3xl border border-white/5 bg-neutral-950/40 text-left reveal-on-scroll stagger-2 flex flex-col justify-between"
                        onMouseMove={handleCardMouseMove}
                    >
                        <div className="glow-card-glow" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-5">
                            <div>
                                <div className="glow-card-icon-wrapper glow-card-icon-wrapper--green">
                                    <Cpu className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Auto-detection
                                </h3>
                                <p className="text-neutral-400 text-xs leading-relaxed">
                                    Paste raw payloads and let our multi-layer analyzer
                                    automatically detect candidates.
                                </p>
                            </div>

                            {/* Confidence Ranking Widget */}
                            <div className="bento-widget select-none">
                                <div className="bento-widget-header">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>Candidates ranked</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-neutral-200 w-12 shrink-0">
                                            Base64
                                        </span>
                                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-emerald-400/80"
                                                style={{ width: '95%' }}
                                            />
                                        </div>
                                        <span className="text-emerald-400 font-bold font-mono">
                                            0.95
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-neutral-200 w-12 shrink-0">Hex</span>
                                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-cyan-400/70"
                                                style={{ width: '41%' }}
                                            />
                                        </div>
                                        <span className="text-cyan-400 font-bold font-mono">
                                            0.41
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-neutral-200 w-12 shrink-0">
                                            ROT13
                                        </span>
                                        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-neutral-600"
                                                style={{ width: '8%' }}
                                            />
                                        </div>
                                        <span className="text-neutral-500 font-bold font-mono">
                                            0.08
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Live WebSocket (Spans 1 column) */}
                    <div
                        className="glow-card p-6 md:col-span-1 rounded-3xl border border-white/5 bg-neutral-950/40 text-left reveal-on-scroll stagger-3 flex flex-col justify-between"
                        onMouseMove={handleCardMouseMove}
                    >
                        <div className="glow-card-glow" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-5">
                            <div>
                                <div className="glow-card-icon-wrapper glow-card-icon-wrapper--amber">
                                    <Radio className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Live WebSocket
                                </h3>
                                <p className="text-neutral-400 text-xs leading-relaxed">
                                    Watch decoding happen instantly as you type with real-time
                                    stream integration.
                                </p>
                            </div>

                            {/* Socket Event Stream Widget */}
                            <div className="bento-widget select-none font-mono">
                                <div className="bento-widget-header">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span>socket.io</span>
                                </div>
                                <div className="flex flex-col gap-1.5 text-[10px]">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-cyan-400 font-bold">→</span>
                                        <span className="text-neutral-200">decode:live</span>
                                        <span className="text-neutral-600 truncate">
                                            "NDg2NTZj..."
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-emerald-400 font-bold">←</span>
                                        <span className="text-neutral-200">ok</span>
                                        <span className="text-neutral-600">
                                            · Base64 → Hex · 2 steps
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: REST API (Spans 2 columns) */}
                    <div
                        className="glow-card p-6 md:col-span-2 rounded-3xl border border-white/5 bg-neutral-950/40 text-left reveal-on-scroll stagger-4 flex flex-col justify-between"
                        onMouseMove={handleCardMouseMove}
                    >
                        <div className="glow-card-glow" />
                        <div className="relative z-10 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center w-full">
                            <div className="flex-1">
                                <div className="glow-card-icon-wrapper glow-card-icon-wrapper--blue">
                                    <Terminal className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">REST API</h3>
                                <p className="text-neutral-400 text-xs leading-relaxed max-w-md">
                                    Call the same decode pipeline from your own code over a simple
                                    JSON API, authenticated with scoped keys.
                                </p>
                            </div>

                            {/* API Mockup Widget */}
                            <div className="bento-widget select-none shrink-0 self-stretch md:self-auto flex flex-col justify-between font-mono">
                                <div className="bento-widget-header">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>POST /api/decode</span>
                                </div>
                                <div className="flex flex-col gap-1 text-[10px]">
                                    <div>
                                        <span className="text-neutral-500">{'{'}</span>
                                    </div>
                                    <div className="pl-3">
                                        <span className="text-emerald-400 font-bold">"type"</span>
                                        <span className="text-neutral-500">:</span>{' '}
                                        <span className="text-amber-400">"jwt"</span>
                                        <span className="text-neutral-500">,</span>
                                    </div>
                                    <div className="pl-3">
                                        <span className="text-emerald-400 font-bold">"valid"</span>
                                        <span className="text-neutral-500">:</span>{' '}
                                        <span className="text-blue-400 font-bold">true</span>
                                    </div>
                                    <div>
                                        <span className="text-neutral-500">{'}'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 5: Shareable Results */}
                    <div
                        className="glow-card p-6 md:col-span-1 rounded-3xl border border-white/5 bg-neutral-950/40 text-left reveal-on-scroll stagger-1 flex flex-col justify-between"
                        onMouseMove={handleCardMouseMove}
                    >
                        <div className="glow-card-glow" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-5">
                            <div>
                                <div className="glow-card-icon-wrapper glow-card-icon-wrapper--blue">
                                    <Share2 className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Shareable Results
                                </h3>
                                <p className="text-neutral-400 text-xs leading-relaxed">
                                    Turn any decode into a public link with the full pipeline
                                    attached. Links expire automatically.
                                </p>
                            </div>

                            {/* Share Link Widget */}
                            <div className="bento-widget select-none font-mono">
                                <div className="bento-widget-header">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                    <span>Public link</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 text-[10px]">
                                    <span className="text-neutral-200 truncate">
                                        rasbur.vercel.app/s/k3x9q2
                                    </span>
                                    <span className="text-neutral-500 shrink-0 px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                                        30d
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 6: Visual Compare */}
                    <div
                        className="glow-card p-6 md:col-span-1 rounded-3xl border border-white/5 bg-neutral-950/40 text-left reveal-on-scroll stagger-2 flex flex-col justify-between"
                        onMouseMove={handleCardMouseMove}
                    >
                        <div className="glow-card-glow" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-5">
                            <div>
                                <div className="glow-card-icon-wrapper glow-card-icon-wrapper--purple">
                                    <GitCompareArrows className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    Visual Compare
                                </h3>
                                <p className="text-neutral-400 text-xs leading-relaxed">
                                    Decode two payloads side by side with a character-level diff of
                                    the outputs.
                                </p>
                            </div>

                            {/* Char Diff Widget */}
                            <div className="bento-widget select-none font-mono">
                                <div className="bento-widget-header">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                                    <span>Output diff</span>
                                </div>
                                <div className="flex flex-col gap-1.5 text-[10px]">
                                    <div className="text-neutral-200">
                                        admin<span className="diff-char-removed">=false</span>
                                    </div>
                                    <div className="text-neutral-200">
                                        admin<span className="diff-char-added">=true</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 7: API Keys & Limits */}
                    <div
                        className="glow-card p-6 md:col-span-1 rounded-3xl border border-white/5 bg-neutral-950/40 text-left reveal-on-scroll stagger-3 flex flex-col justify-between"
                        onMouseMove={handleCardMouseMove}
                    >
                        <div className="glow-card-glow" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-5">
                            <div>
                                <div className="glow-card-icon-wrapper glow-card-icon-wrapper--amber">
                                    <KeyRound className="w-5 h-5" strokeWidth={1.8} />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">
                                    API Keys & Limits
                                </h3>
                                <p className="text-neutral-400 text-xs leading-relaxed">
                                    Issue scoped keys, track usage per key, and stay inside
                                    transparent daily rate limits.
                                </p>
                            </div>

                            {/* Key Usage Widget */}
                            <div className="bento-widget select-none font-mono">
                                <div className="bento-widget-header">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    <span>X-API-Key: ••••••••••</span>
                                </div>
                                <div className="flex flex-col gap-1.5 text-[10px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-neutral-200">Usage today</span>
                                        <span className="text-amber-400 font-bold">62 / 100</span>
                                    </div>
                                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-amber-400/70"
                                            style={{ width: '62%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-24 relative z-10 border border-white/5 bg-neutral-950/45 backdrop-blur-md rounded-3xl p-8 md:p-12 text-center">
                <div className="text-center mb-12 reveal-on-scroll">
                    <h2 className="text-2xl md:text-4xl font-black text-white">
                        From encoded to readable in three steps
                    </h2>
                </div>

                <div className="relative mt-8">
                    {/* Animated moving dashed connector line for desktop */}
                    <div className="hidden md:block workflow-connector-glow" />
                    <div className="hidden md:block workflow-connector-line" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {/* Step 1: Paste */}
                        <div
                            onMouseEnter={() => {
                                setActiveWorkflowStep(0);
                                setIsHoveringWorkflow(true);
                            }}
                            onMouseLeave={() => setIsHoveringWorkflow(false)}
                            className={`workflow-step-card p-6 rounded-2xl text-left transition-all duration-500 border ${
                                activeWorkflowStep === 0
                                    ? 'border-[#0066FF]/30 bg-neutral-950/70 shadow-[0_0_20px_rgba(0,102,255,0.04)]'
                                    : 'border-white/5 bg-neutral-950/20 opacity-70'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {/* Glowing Step Number Circle */}
                                    <div
                                        className={`w-9 h-9 rounded-full font-mono font-bold text-xs flex items-center justify-center transition-all duration-500 ${
                                            activeWorkflowStep === 0
                                                ? 'bg-[#0066FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.35)]'
                                                : 'bg-white/5 text-neutral-400 border border-white/10'
                                        }`}
                                    >
                                        01
                                    </div>
                                    <h4 className="text-base font-bold text-white">Paste</h4>
                                </div>

                                {/* Pulsing status dot */}
                                <div className="relative flex h-2 w-2">
                                    <span
                                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                            activeWorkflowStep === 0
                                                ? 'bg-[#0066FF]'
                                                : 'bg-transparent'
                                        }`}
                                    ></span>
                                    <span
                                        className={`relative inline-flex rounded-full h-2 w-2 ${
                                            activeWorkflowStep === 0
                                                ? 'bg-[#0066FF]'
                                                : 'bg-neutral-700'
                                        }`}
                                    ></span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div
                                    className={`p-2 rounded-lg border transition-all duration-500 shrink-0 ${
                                        activeWorkflowStep === 0
                                            ? 'bg-[#0066FF]/10 border-[#0066FF]/20 text-[#60a5fa]'
                                            : 'bg-white/5 border-white/10 text-neutral-400'
                                    }`}
                                >
                                    <Clipboard className="w-4 h-4" strokeWidth={1.8} />
                                </div>
                                <p className="text-neutral-400 text-xs leading-relaxed mt-1">
                                    Drop in any encoded string — Base64, hex, a JWT, Morse, a
                                    cipher, or several layers at once.
                                </p>
                            </div>
                        </div>

                        {/* Step 2: Detect */}
                        <div
                            onMouseEnter={() => {
                                setActiveWorkflowStep(1);
                                setIsHoveringWorkflow(true);
                            }}
                            onMouseLeave={() => setIsHoveringWorkflow(false)}
                            className={`workflow-step-card p-6 rounded-2xl text-left transition-all duration-500 border ${
                                activeWorkflowStep === 1
                                    ? 'border-[#00E5FF]/30 bg-neutral-950/70 shadow-[0_0_20px_rgba(0,229,255,0.04)]'
                                    : 'border-white/5 bg-neutral-950/20 opacity-70'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {/* Glowing Step Number Circle */}
                                    <div
                                        className={`w-9 h-9 rounded-full font-mono font-bold text-xs flex items-center justify-center transition-all duration-500 ${
                                            activeWorkflowStep === 1
                                                ? 'bg-[#00E5FF] text-black shadow-[0_0_15px_rgba(0,229,255,0.35)]'
                                                : 'bg-white/5 text-neutral-400 border border-white/10'
                                        }`}
                                    >
                                        02
                                    </div>
                                    <h4 className="text-base font-bold text-white">Detect</h4>
                                </div>

                                {/* Pulsing status dot */}
                                <div className="relative flex h-2 w-2">
                                    <span
                                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                            activeWorkflowStep === 1
                                                ? 'bg-[#00E5FF]'
                                                : 'bg-transparent'
                                        }`}
                                    ></span>
                                    <span
                                        className={`relative inline-flex rounded-full h-2 w-2 ${
                                            activeWorkflowStep === 1
                                                ? 'bg-[#00E5FF]'
                                                : 'bg-neutral-700'
                                        }`}
                                    ></span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div
                                    className={`p-2 rounded-lg border transition-all duration-500 shrink-0 ${
                                        activeWorkflowStep === 1
                                            ? 'bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF]'
                                            : 'bg-white/5 border-white/10 text-neutral-400'
                                    }`}
                                >
                                    <Search className="w-4 h-4" strokeWidth={1.8} />
                                </div>
                                <p className="text-neutral-400 text-xs leading-relaxed mt-1">
                                    Rasbur scores each decoder against the input and the decoded
                                    output to find the best match.
                                </p>
                            </div>
                        </div>

                        {/* Step 3: Decode */}
                        <div
                            onMouseEnter={() => {
                                setActiveWorkflowStep(2);
                                setIsHoveringWorkflow(true);
                            }}
                            onMouseLeave={() => setIsHoveringWorkflow(false)}
                            className={`workflow-step-card p-6 rounded-2xl text-left transition-all duration-500 border ${
                                activeWorkflowStep === 2
                                    ? 'border-[#0066FF]/30 bg-neutral-950/70 shadow-[0_0_20px_rgba(0,102,255,0.04)]'
                                    : 'border-white/5 bg-neutral-950/20 opacity-70'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {/* Glowing Step Number Circle */}
                                    <div
                                        className={`w-9 h-9 rounded-full font-mono font-bold text-xs flex items-center justify-center transition-all duration-500 ${
                                            activeWorkflowStep === 2
                                                ? 'bg-[#0066FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.35)]'
                                                : 'bg-white/5 text-neutral-400 border border-white/10'
                                        }`}
                                    >
                                        03
                                    </div>
                                    <h4 className="text-base font-bold text-white">Decode</h4>
                                </div>

                                {/* Pulsing status dot */}
                                <div className="relative flex h-2 w-2">
                                    <span
                                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                            activeWorkflowStep === 2
                                                ? 'bg-[#0066FF]'
                                                : 'bg-transparent'
                                        }`}
                                    ></span>
                                    <span
                                        className={`relative inline-flex rounded-full h-2 w-2 ${
                                            activeWorkflowStep === 2
                                                ? 'bg-[#0066FF]'
                                                : 'bg-neutral-700'
                                        }`}
                                    ></span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div
                                    className={`p-2 rounded-lg border transition-all duration-500 shrink-0 ${
                                        activeWorkflowStep === 2
                                            ? 'bg-[#0066FF]/10 border-[#0066FF]/20 text-[#60a5fa]'
                                            : 'bg-white/5 border-white/10 text-neutral-400'
                                    }`}
                                >
                                    <Code className="w-4 h-4" strokeWidth={1.8} />
                                </div>
                                <p className="text-neutral-400 text-xs leading-relaxed mt-1">
                                    It peels back each layer in order, showing every step and its
                                    confidence score.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-dev-card relative z-10 rounded-3xl p-12 text-center overflow-hidden reveal-on-scroll">
                <div className="cta-dev-card-glow" />
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
                        Decode your first string
                    </h2>
                    <p className="text-neutral-500 text-sm md:text-base mb-8 max-w-xl mx-auto">
                        Open the workspace, paste a string, and watch every layer come apart.
                    </p>
                    <div className="flex justify-center">
                        <Link
                            className="cta-pulse-btn px-8 py-3.5 rounded-full text-base font-bold transition-all duration-300"
                            to="/decode"
                        >
                            Start Decoding Now
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="home-footer mt-24 pt-12 pb-8 border-t border-white/10 relative z-10 w-full text-left">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="flex flex-col gap-3">
                        <Link className="flex items-center gap-2 no-underline" to="/">
                            <span className="app-brand-name text-lg font-bold text-white tracking-tight">
                                Rasbur
                            </span>
                        </Link>
                        <p className="text-neutral-500 text-sm leading-relaxed">
                            Detects and decodes encoded strings — in your browser or over the API.
                        </p>
                        <p className="text-neutral-600 text-xs">Free and open source · MIT</p>
                    </div>

                    {/* Product Column */}
                    <div>
                        <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">
                            Product
                        </h4>
                        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                            <li>
                                <Link
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    to="/decode"
                                >
                                    Workspace
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    to="/compare"
                                >
                                    Compare
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    to="/docs"
                                >
                                    API Reference
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Resources Column */}
                    <div>
                        <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">
                            Resources
                        </h4>
                        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                            <li>
                                <Link
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    to="/docs"
                                >
                                    Documentation
                                </Link>
                            </li>
                            <li>
                                <a
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    href="https://github.com/omanshchoudhary/rasbur"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    href="https://github.com/omanshchoudhary/rasbur/issues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Support
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">
                            Legal
                        </h4>
                        <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                            <li>
                                <Link
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    to="/privacy"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    to="/terms"
                                >
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <a
                                    className="footer-link text-neutral-400 hover:text-white text-sm transition-colors duration-200 no-underline"
                                    href="https://github.com/omanshchoudhary/rasbur/blob/main/LICENSE"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    License (MIT)
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Sub-footer row */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-500">
                    <div>&copy; {new Date().getFullYear()} Rasbur. All rights reserved.</div>
                    <div className="flex items-center gap-2">
                        <span className="status-dot"></span>
                        <span>
                            {decoderCount !== null
                                ? `API online · ${decoderCount} decoders`
                                : 'In beta'}
                        </span>
                    </div>
                </div>
            </footer>
        </main>
    );
}
