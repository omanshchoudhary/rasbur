import { Link } from 'react-router-dom';

export interface LegalSection {
    heading: string;
    body: React.ReactNode;
}

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    intro: string;
    sections: LegalSection[];
}

export default function LegalPage({ title, lastUpdated, intro, sections }: LegalPageProps) {
    return (
        <main className="bg-cyber-grid relative min-h-screen px-4 py-12 md:py-20 mx-auto max-w-3xl">
            <div className="aura-container">
                <div className="aura-blob aura-blob--purple" />
                <div className="aura-blob aura-blob--teal" />
            </div>

            <div className="relative z-10 text-left">
                <p className="font-mono text-xs tracking-wider uppercase text-neutral-500 mb-3">
                    Last updated: {lastUpdated}
                </p>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-6">{title}</h1>
                <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-10">
                    {intro}
                </p>

                <div className="flex flex-col gap-8">
                    {sections.map((section) => (
                        <section
                            key={section.heading}
                            className="border border-white/5 bg-neutral-950/40 rounded-2xl p-6 md:p-8"
                        >
                            <h2 className="text-lg font-bold text-white mb-3">{section.heading}</h2>
                            <div className="text-neutral-400 text-sm leading-relaxed flex flex-col gap-3">
                                {section.body}
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-12 text-sm text-neutral-500">
                    Questions? Open an issue on{' '}
                    <a
                        className="text-neutral-300 hover:text-white underline underline-offset-2"
                        href="https://github.com/omanshchoudhary/rasbur/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GitHub
                    </a>{' '}
                    or head back to the{' '}
                    <Link
                        className="text-neutral-300 hover:text-white underline underline-offset-2"
                        to="/"
                    >
                        home page
                    </Link>
                    .
                </div>
            </div>
        </main>
    );
}
