import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.js';
import DecodePage from './pages/DecodePage.js';

export default function App() {
    return (
        <BrowserRouter>
            <nav>
                <Link to="/">Home</Link> | <Link to="/decode">Decode</Link>
            </nav>

            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/decode" element={<DecodePage />} />
            </Routes> 
        </BrowserRouter>
    );
}
