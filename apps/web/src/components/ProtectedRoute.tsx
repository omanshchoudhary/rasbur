import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext.js";

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (
            <div className="min-h-screen bg-surface-950 flex items-center justify-center">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-accent-blue animate-spin" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-accent-blue to-accent-teal rounded-full opacity-30 blur-xl animate-pulse animate-duration-1000" />
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return <Outlet />;
}