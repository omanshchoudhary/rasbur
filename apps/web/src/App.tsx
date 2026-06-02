import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout.js';
import HomePage from '@/pages/HomePage.js';
import DecodePage from '@/pages/DecodePage.js';
import AuthCallbackPage from './pages/AuthCallbackPage.js';
import { AuthProvider } from './context/AuthContext.js';
import LoginPage from './pages/LoginPage.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import ProfilePage from './pages/ProfilePage.js';
import ComingSoonPage from './pages/ComingSoonPage.js';
import HistoryPage from './pages/HistoryPage.js';
import SharedResultPage from './pages/SharedResultPage.js';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/decode" element={<DecodePage />} />
                        <Route path="/compare" element={<ComingSoonPage featureName="Compare Tool" phase="Phase 7" description="Compare two encoded strings side-by-side with character-level differences highlighted." />} />
                        <Route path="/docs" element={<ComingSoonPage featureName="API Documentation" phase="Phase 11" description="Integrate Rasbur directly into your workflows with our fully-featured REST API docs and SDKs." />} />
                        <Route path="/s/:slug" element={<SharedResultPage />} />
                        <Route path="/auth/callback" element={<AuthCallbackPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/settings/profile" element={<ProfilePage />} />
                            <Route path="/history" element={<HistoryPage />} />
                            <Route path="/plugins" element={<ComingSoonPage featureName="Custom Plugins" phase="Phase 10" description="Write, test, and sandbox-run custom string decoders in our Monaco Editor workspace." />} />
                            <Route path="/settings/api-keys" element={<ComingSoonPage featureName="API Keys" phase="Phase 8" description="Provision, manage, and track usage statistics for cryptographically secure API keys." />} />
                            <Route path="/settings/webhooks" element={<ComingSoonPage featureName="Webhook Integrations" phase="Phase 13" description="Configure, activate, and review delivery logs for real-time decoding event webhooks." />} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>

    );
}
