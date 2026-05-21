import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout.js';
import HomePage from '@/pages/HomePage.js';
import DecodePage from '@/pages/DecodePage.js';
import AuthCallbackPage from './pages/AuthCallbackPage.js';
import { AuthProvider } from './context/AuthContext.js';
import LoginPage from './pages/LoginPage.js';
import ProtectedRoute from './components/ProtectedRoute.js';
import ProfilePage from './pages/ProfilePage.js';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/decode" element={<DecodePage />} />
                        <Route path="/auth/callback" element={<AuthCallbackPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/settings/profile" element={<ProfilePage />} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>

    );
}
