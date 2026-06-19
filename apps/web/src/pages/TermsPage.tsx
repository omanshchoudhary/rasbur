import LegalPage from '@/components/LegalPage.js';

export default function TermsPage() {
    return (
        <LegalPage
            title="Terms of Service"
            lastUpdated="June 10, 2026"
            intro="These terms govern your use of Rasbur, a string decoding platform currently in beta. By using the site or API, you agree to them. They are intentionally short and written in plain language."
            sections={[
                {
                    heading: 'The service',
                    body: (
                        <p>
                            Rasbur detects and decodes encoded strings (Base64, Hex, JWT, URL,
                            Morse, and more) through a web workspace, REST API, and live WebSocket
                            decoding. The service is provided in beta: features may change, break,
                            or be removed without notice.
                        </p>
                    ),
                },
                {
                    heading: 'Your account',
                    body: (
                        <p>
                            You sign in through Google or GitHub. You are responsible for activity
                            under your account and for keeping your API keys secret. If a key leaks,
                            revoke it immediately from your account settings.
                        </p>
                    ),
                },
                {
                    heading: 'Acceptable use',
                    body: (
                        <>
                            <p>You agree not to:</p>
                            <ul className="list-disc pl-5 flex flex-col gap-1">
                                <li>
                                    use Rasbur to facilitate illegal activity or to attack systems
                                    you are not authorized to test;
                                </li>
                                <li>
                                    attempt to disrupt the service, bypass rate limits, or access
                                    other users&apos; data;
                                </li>
                                <li>resell the service or API without permission.</li>
                            </ul>
                            <p>
                                Security research and CTF use on systems you are authorized to test
                                is welcome — that is what Rasbur is built for.
                            </p>
                        </>
                    ),
                },
                {
                    heading: 'Your content',
                    body: (
                        <p>
                            Inputs you decode remain yours. Saved history entries are private to
                            your account. If you create a share link, anyone with that link can view
                            the shared result until it expires or you delete it.
                        </p>
                    ),
                },
                {
                    heading: 'Rate limits',
                    body: (
                        <p>
                            Usage is subject to daily rate limits. Limits may be adjusted during the
                            beta to keep the service stable for everyone.
                        </p>
                    ),
                },
                {
                    heading: 'No warranty',
                    body: (
                        <p>
                            Rasbur is provided &quot;as is&quot;, without warranty of any kind.
                            Decode results are best-effort and may be incorrect. We are not liable
                            for any damages arising from use of the service, to the maximum extent
                            permitted by law.
                        </p>
                    ),
                },
                {
                    heading: 'Termination',
                    body: (
                        <p>
                            We may suspend accounts that violate these terms. You may stop using the
                            service and request account deletion at any time.
                        </p>
                    ),
                },
                {
                    heading: 'Changes',
                    body: (
                        <p>
                            We may update these terms as the product evolves. Continued use after an
                            update means you accept the revised terms.
                        </p>
                    ),
                },
            ]}
        />
    );
}
