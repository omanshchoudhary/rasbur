import LegalPage from '@/components/LegalPage.js';

export default function PrivacyPage() {
    return (
        <LegalPage
            title="Privacy Policy"
            lastUpdated="June 10, 2026"
            intro="Rasbur is a string decoding platform currently in beta. This policy explains what data we collect, why we collect it, and how it is handled. The short version: we store as little as possible, and your decode inputs are not stored unless you explicitly save them."
            sections={[
                {
                    heading: 'What we collect',
                    body: (
                        <>
                            <p>
                                <strong className="text-neutral-200">Account data.</strong> If you
                                sign in with Google or GitHub, we receive your name, email address,
                                and avatar from the OAuth provider. We never see or store your
                                password.
                            </p>
                            <p>
                                <strong className="text-neutral-200">Decode history.</strong> Decode
                                inputs are processed in memory and are not stored — unless you are
                                signed in and explicitly save a result to your history or create a
                                share link.
                            </p>
                            <p>
                                <strong className="text-neutral-200">API usage.</strong> If you
                                create API keys, we store usage counts and timestamps to enforce
                                rate limits. We do not log the content of API decode requests.
                            </p>
                        </>
                    ),
                },
                {
                    heading: 'What we do not do',
                    body: (
                        <>
                            <p>
                                We do not sell your data. We do not run third-party advertising or
                                tracking scripts. We do not read your decode inputs for any purpose
                                other than returning a result to you.
                            </p>
                        </>
                    ),
                },
                {
                    heading: 'Cookies and local storage',
                    body: (
                        <p>
                            We use browser local storage to keep your authentication tokens so you
                            stay signed in. No third-party tracking cookies are set.
                        </p>
                    ),
                },
                {
                    heading: 'Infrastructure',
                    body: (
                        <p>
                            Rasbur runs on Vercel (frontend), Render (backend API), MongoDB Atlas
                            (database), and Upstash (rate limiting). Data is processed on their
                            infrastructure under their respective security practices.
                        </p>
                    ),
                },
                {
                    heading: 'Deleting your data',
                    body: (
                        <p>
                            You can delete saved history entries and revoke API keys from your
                            account at any time. To request full account deletion, open an issue on
                            GitHub and we will remove your account data.
                        </p>
                    ),
                },
                {
                    heading: 'Changes to this policy',
                    body: (
                        <p>
                            As Rasbur is in beta, this policy may change as features evolve. The
                            "Last updated" date at the top reflects the latest revision.
                        </p>
                    ),
                },
            ]}
        />
    );
}
