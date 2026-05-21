import { api } from "@/services/api.js";
import { User } from "@rasbur/shared"
import React, { createContext, useEffect, useState, useContext } from "react";
import { getRefreshToken, clearAuthTokens } from "@/services/auth.js";

type AuthContextType = {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

// Available to all components to know the status of user to modify ui/ux
// Initially empty box
const AuthContext = createContext<AuthContextType | null>(null);

// Adds value to Auth Context
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        async function checkAuth() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.getUserProfile();
                if (response.ok && response.user) {
                    setUser(response.user);
                    setIsAuthenticated(true);
                } else {
                    handleAuthFailure();
                }
            } catch (error) {
                handleAuthFailure();
            } finally {
                setLoading(false);
            }
        }
        checkAuth();
    }, []);

    function handleAuthFailure() {
        clearAuthTokens();
        setUser(null);
        setIsAuthenticated(false);
    }
    function login() {
        window.location.href = "/login";
    }

    async function logout() {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
            try {
                // Inform the backend to invalidate this refresh session
                const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken }),
                });
            } catch (err) {
                console.error("Failed to revoke session on server during logout:", err);
            }
        }
        handleAuthFailure();
        window.location.href = "/login";
    }
    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}


export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}