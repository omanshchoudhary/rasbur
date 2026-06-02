import { Link } from 'react-router-dom';

interface ComingSoonPageProps {
    featureName: string;
    phase: string;
    description: string;
}

export default function ComingSoonPage({ featureName, phase, description }: ComingSoonPageProps) {
    return (
        <main className="coming-soon-page bg-cyber-grid relative min-h-[80vh] flex items-center justify-center px-4">
            <div className="aura-container">
                <div className="aura-blob aura-blob--purple" />
                <div className="aura-blob aura-blob--teal" />
            </div>
            <div className="glow-card max-w-lg w-100 p-8 md:p-12 rounded-3xl border border-white/5 bg-surface-900 text-center relative z-10">
                <span className="cyber-badge mb-6">{phase} Feature</span>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
                    {featureName} <span className="text-glow-gradient">Workspace</span>
                </h1>
                <p className="text-text-300 text-sm md:text-base leading-relaxed mb-8">
                    {description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link className="home-cta-primary glow-btn-primary px-6 py-2.5 rounded-full font-bold text-sm" to="/decode">
                        Open Decode Workspace
                    </Link>
                    <Link className="home-cta-secondary px-6 py-2.5 rounded-full font-bold text-sm border border-white/10 hover:bg-white/5" to="/">
                        Return Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
