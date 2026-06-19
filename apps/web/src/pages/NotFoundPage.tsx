import { Link, useLocation } from 'react-router-dom';

export default function NotFoundPage() {
    const location = useLocation();

    return (
        <main className="not-found-page bg-cyber-grid relative min-h-[80vh] flex items-center justify-center px-4">
            <div className="aura-container">
                <div className="aura-blob aura-blob--purple" />
                <div className="aura-blob aura-blob--teal" />
            </div>

            <div className="glow-card max-w-lg w-full p-8 md:p-12 rounded-3xl border border-white/5 bg-surface-900 text-center relative z-10">
                <span className="cyber-badge mb-6">Error 404</span>

                <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
                    This page didn&apos;t <span className="text-glow-gradient">decode</span>
                </h1>

                {/* On-brand: the missing route shown as an input that resolves to nothing */}
                <div className="font-mono text-xs md:text-sm bg-black/40 border border-white/10 rounded-xl px-4 py-3 mb-6 text-left overflow-hidden">
                    <span className="text-neutral-500">decode(</span>
                    <span className="text-amber-400 break-all">
                        &quot;{location.pathname}&quot;
                    </span>
                    <span className="text-neutral-500">)</span>
                    <span className="text-neutral-600"> → </span>
                    <span className="text-rose-400">null</span>
                </div>

                <p className="text-text-300 text-sm md:text-base leading-relaxed mb-8">
                    That URL doesn&apos;t match anything here. It may be mistyped, or the page may
                    have moved.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        className="home-cta-primary glow-btn-primary px-6 py-2.5 rounded-full font-bold text-sm"
                        to="/decode"
                    >
                        Open the workspace
                    </Link>
                    <Link
                        className="home-cta-secondary px-6 py-2.5 rounded-full font-bold text-sm border border-white/10 hover:bg-white/5"
                        to="/"
                    >
                        Return home
                    </Link>
                </div>
            </div>
        </main>
    );
}
