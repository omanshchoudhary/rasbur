import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.js';
import { useState, useRef, useEffect } from 'react';

export default function AppLayout() {
    const { user, isAuthenticated, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name: string) => {
        return name
            ? name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
            : '?';
    };

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header-inner">
                    <NavLink className="app-brand" to="/">
                        Rasbur
                    </NavLink>

                    <nav className="app-nav" aria-label="Primary">
                        <NavLink
                            className={({ isActive }) =>
                                isActive ? 'app-nav-link is-active' : 'app-nav-link'
                            }
                            to="/"
                            end
                        >
                            Home
                        </NavLink>
                        <NavLink
                            className={({ isActive }) =>
                                isActive ? 'app-nav-link is-active' : 'app-nav-link'
                            }
                            to="/decode"
                        >
                            Decode
                        </NavLink>
                    </nav>

                    <div className="app-header-actions" aria-label="Header actions">
                        <NavLink className="app-nav-link app-nav-link--cta" to="/decode">
                            Decode Workspace
                        </NavLink>

                        {isAuthenticated && user ? (
                            <div className="user-dropdown-container" ref={dropdownRef}>
                                <button
                                    className="user-dropdown-trigger"
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    aria-expanded={isDropdownOpen}
                                    aria-haspopup="true"
                                >
                                    {user.avatar ? (
                                        <img className="user-avatar" src={user.avatar} alt={user.name} />
                                    ) : (
                                        <div className="user-avatar-placeholder">
                                            {getInitials(user.name)}
                                        </div>
                                    )}
                                    <span>{user.name.split(' ')[0]}</span>
                                    <svg
                                        className="user-dropdown-arrow"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <div className="user-dropdown-menu glass-surface--strong">
                                        <div className="user-dropdown-info">
                                            <p className="user-dropdown-name">{user.name}</p>
                                            <p className="user-dropdown-email">{user.email}</p>
                                        </div>
                                        <div className="user-dropdown-divider" />
                                        <NavLink
                                            to="/settings/profile"
                                            className="user-dropdown-item"
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                />
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                            Settings
                                        </NavLink>
                                        <button
                                            onClick={() => {
                                                setIsDropdownOpen(false);
                                                logout();
                                            }}
                                            className="user-dropdown-item user-dropdown-item--logout"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                />
                                            </svg>
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <NavLink className="app-nav-link" to="/login">
                                Sign In
                            </NavLink>
                        )}
                    </div>
                </div>
            </header>

            <div className="app-content">
                <Outlet />
            </div>
        </div>
    );
}

