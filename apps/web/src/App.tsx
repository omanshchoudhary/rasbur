import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.js';
import HomePage from './pages/HomePage.js';
import DecodePage from './pages/DecodePage.js';

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<AppLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/decode" element={<DecodePage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}
