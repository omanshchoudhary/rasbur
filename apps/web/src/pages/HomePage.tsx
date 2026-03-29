import { useEffect, useState } from 'react';
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
        <main>
            <h1>Rasbur</h1>
            <p>Home page is working.</p>

            {decoderCount !== null && <p>Available decoders: {decoderCount}</p>}
            {error && <p>{error}</p>}
        </main>
    );
}
