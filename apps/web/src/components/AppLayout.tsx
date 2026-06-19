import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.js';
import { useState, useRef, useEffect } from 'react';

export default function AppLayout() {
    // Getting context about User state
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false);
    const [cmdSearchQuery, setCmdSearchQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLockedModalOpen, setIsLockedModalOpen] = useState(false);
    const [lockedFeatureName, setLockedFeatureName] = useState('');
    const [hoveredRect, setHoveredRect] = useState<{
        left: number;
        width: number;
        opacity: number;
    }>({ left: 0, width: 0, opacity: 0 });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const cmdInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (location.hash) {
            const id = location.hash.substring(1);
            const element = document.getElementById(id);
            if (element) {
                const timer = setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 120);
                return () => clearTimeout(timer);
            }
        } else if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location.pathname, location.hash]);

    const mockNotifications = [
        {
            id: '1',
            title: 'Welcome to Rasbur',
            description:
                'Start decoding strings instantly — paste a payload and let the pipeline do the rest.',
            time: 'Just now',
            unread: true,
        },
        {
            id: '2',
            title: 'Pipeline Update',
            description: 'Caesar Cipher decoder now ranks English frequencies 30% faster.',
            time: '2h ago',
            unread: true,
        },
        {
            id: '3',
            title: 'API Rate Limits',
            description: 'Free accounts get 100 daily API requests. Track usage in settings.',
            time: '1d ago',
            unread: false,
        },
    ];

    const [notifications, setNotifications] = useState(mockNotifications);
    const unreadCount = notifications.filter((n) => n.unread).length;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (
                notificationsRef.current &&
                !notificationsRef.current.contains(event.target as Node)
            ) {
                setIsNotificationsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        function handleScroll() {
            setIsScrolled(window.scrollY > 20);
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Prevent body scroll when overlays are active
    useEffect(() => {
        if (isMobileDrawerOpen || isCmdPaletteOpen || isLockedModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileDrawerOpen, isCmdPaletteOpen, isLockedModalOpen]);

    // Global Key Listener for Command Palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCmdPaletteOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsCmdPaletteOpen(false);
                setIsLockedModalOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Auto focus command palette input on open
    useEffect(() => {
        if (isCmdPaletteOpen) {
            setTimeout(() => {
                cmdInputRef.current?.focus();
            }, 60);
        }
    }, [isCmdPaletteOpen]);

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

    const navLinks = [
        { to: '/#features', label: 'Features', end: false, locked: false },
        { to: '/docs', label: 'Docs', end: false, locked: false },
    ];

    const commandItems = [
        {
            id: 'home',
            label: 'Go to Home',
            category: 'Navigation',
            shortcut: 'G H',
            perform: () => navigate('/'),
        },
        {
            id: 'decode',
            label: 'Go to Decoder Workspace',
            category: 'Navigation',
            shortcut: 'G D',
            perform: () => navigate('/decode'),
        },
        {
            id: 'docs',
            label: 'Go to Documentation',
            category: 'Navigation',
            shortcut: 'G O',
            perform: () => navigate('/docs'),
        },
        {
            id: 'login',
            label: 'Sign In / Register',
            category: 'Account',
            shortcut: 'A S',
            perform: () => navigate('/login'),
            hide: isAuthenticated,
        },
        {
            id: 'profile',
            label: 'View Profile Settings',
            category: 'Account',
            shortcut: 'A P',
            perform: () => navigate('/settings/profile'),
            hide: !isAuthenticated,
        },
        {
            id: 'api-keys',
            label: 'Manage API Keys',
            category: 'Account',
            shortcut: 'A K',
            perform: () => navigate('/settings/api-keys'),
            hide: !isAuthenticated,
        },

        {
            id: 'dec-jwt',
            label: 'Decode JWT Token',
            category: 'Decoders',
            shortcut: 'D J',
            perform: () => navigate('/decode'),
        },
        {
            id: 'dec-b64',
            label: 'Decode Base64 JSON',
            category: 'Decoders',
            shortcut: 'D B',
            perform: () => navigate('/decode'),
        },
        {
            id: 'dec-hex',
            label: 'Decode Hex Payload',
            category: 'Decoders',
            shortcut: 'D H',
            perform: () => navigate('/decode'),
        },
        {
            id: 'dec-morse',
            label: 'Decode Morse Code',
            category: 'Decoders',
            shortcut: 'D M',
            perform: () => navigate('/decode'),
        },
    ];

    const filteredItems = commandItems.filter((item) => {
        if (item.hide) return false;
        return (
            item.label.toLowerCase().includes(cmdSearchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(cmdSearchQuery.toLowerCase())
        );
    });

    useEffect(() => {
        setActiveIndex(0);
    }, [cmdSearchQuery]);

    const handleCmdPaletteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (filteredItems.length === 0) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((prev) => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const activeCmd = filteredItems[activeIndex];
            if (activeCmd) {
                activeCmd.perform();
                setIsCmdPaletteOpen(false);
                setCmdSearchQuery('');
            }
        }
    };

    const handleNotificationClick = (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    };

    const handleMarkAllRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    };

    const closeMobileDrawer = () => setIsMobileDrawerOpen(false);

    return (
        <div className="app-shell">
            <header className={`app-header ${isScrolled ? 'header--scrolled' : ''}`}>
                <div className="app-header-inner">
                    <NavLink className="app-brand" to="/">
                        <span className="app-brand-name">Rasbur</span>
                        <span className="app-brand-tagline">Intelligent Decoder</span>
                    </NavLink>

                    <nav
                        className="app-nav"
                        aria-label="Primary"
                        onMouseLeave={() => setHoveredRect((prev) => ({ ...prev, opacity: 0 }))}
                    >
                        <span
                            className="app-nav-highlight"
                            style={{
                                transform: `translateX(${hoveredRect.left}px)`,
                                width: `${hoveredRect.width}px`,
                                opacity: hoveredRect.opacity,
                            }}
                        />
                        {navLinks.map((link) => {
                            const isLocked = link.locked;
                            const handleLinkClick = (e: React.MouseEvent) => {
                                if (isLocked) {
                                    e.preventDefault();
                                    setLockedFeatureName(link.label);
                                    setIsLockedModalOpen(true);
                                    return;
                                }

                                if (link.to.startsWith('/#')) {
                                    const id = link.to.substring(2);
                                    if (location.pathname === '/') {
                                        e.preventDefault();
                                        const element = document.getElementById(id);
                                        if (element) {
                                            element.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'start',
                                            });
                                            window.history.pushState(null, '', link.to);
                                        }
                                    }
                                }
                            };

                            return (
                                <NavLink
                                    key={link.to}
                                    className={() => {
                                        const isLinkActive = link.to.includes('#')
                                            ? location.pathname === '/' &&
                                              location.hash === link.to.substring(1)
                                            : location.pathname === link.to;
                                        return isLinkActive
                                            ? 'app-nav-link is-active'
                                            : 'app-nav-link';
                                    }}
                                    to={isLocked ? '#' : link.to}
                                    end={link.end}
                                    onClick={handleLinkClick}
                                    onMouseEnter={(e) => {
                                        const el = e.currentTarget;
                                        setHoveredRect({
                                            left: el.offsetLeft,
                                            width: el.offsetWidth,
                                            opacity: 1,
                                        });
                                    }}
                                >
                                    {link.label}
                                    {isLocked && (
                                        <span className="nav-lock-icon">
                                            <svg viewBox="0 0 24 24">
                                                <rect
                                                    x="3"
                                                    y="11"
                                                    width="18"
                                                    height="11"
                                                    rx="2"
                                                    ry="2"
                                                />
                                                <path d="M7 11V7a5 5 0 0110 0v4" />
                                            </svg>
                                        </span>
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    <div className="app-header-actions">
                        <button
                            className="cmd-palette-btn"
                            onClick={() => setIsCmdPaletteOpen(true)}
                            aria-label="Search"
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35" />
                            </svg>
                            <span className="cmd-palette-kbd">⌘K</span>
                        </button>
                        <div className="notifications-bell-container" ref={notificationsRef}>
                            <button
                                className="notifications-bell-trigger"
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                aria-expanded={isNotificationsOpen}
                                aria-haspopup="true"
                                aria-label="Notifications"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                {unreadCount > 0 && <span className="notifications-indicator" />}
                            </button>
                            {isNotificationsOpen && (
                                <div className="notifications-dropdown-menu">
                                    <div className="notifications-dropdown-header">
                                        <h4>Notifications</h4>
                                        {unreadCount > 0 && (
                                            <button
                                                className="notifications-mark-read"
                                                onClick={handleMarkAllRead}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>
                                    <div className="notifications-dropdown-list">
                                        {unreadCount > 0 && (
                                            <div className="notifications-section-label">New</div>
                                        )}
                                        {notifications
                                            .filter((n) => n.unread)
                                            .map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className="notification-dropdown-item"
                                                    onClick={() =>
                                                        handleNotificationClick(notif.id)
                                                    }
                                                >
                                                    <span className="notification-dot-indicator notification-dot-indicator--unread" />
                                                    <div className="notification-item-body">
                                                        <p className="notification-item-title">
                                                            {notif.title}
                                                        </p>
                                                        <p className="notification-item-desc">
                                                            {notif.description}
                                                        </p>
                                                        <span className="notification-item-time">
                                                            {notif.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        <div className="notifications-section-label">Earlier</div>
                                        {notifications
                                            .filter((n) => !n.unread)
                                            .map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    className="notification-dropdown-item"
                                                >
                                                    <span className="notification-dot-indicator notification-dot-indicator--read" />
                                                    <div className="notification-item-body">
                                                        <p className="notification-item-title">
                                                            {notif.title}
                                                        </p>
                                                        <p className="notification-item-desc">
                                                            {notif.description}
                                                        </p>
                                                        <span className="notification-item-time">
                                                            {notif.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                    <div className="notifications-dropdown-footer">
                                        <button
                                            className="notifications-view-all"
                                            onClick={() => setIsNotificationsOpen(false)}
                                        >
                                            Dismiss Menu
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <NavLink className="header-workspace-btn" to="/decode">
                            Workspace
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
                                        <img
                                            className="user-avatar"
                                            src={user.avatar}
                                            alt={user.name}
                                        />
                                    ) : (
                                        <div className="user-avatar-placeholder">
                                            {getInitials(user.name)}
                                        </div>
                                    )}
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
                                    <div className="user-dropdown-menu">
                                        <div className="user-dropdown-card">
                                            {user.avatar ? (
                                                <img
                                                    className="user-dropdown-card-avatar"
                                                    src={user.avatar}
                                                    alt={user.name}
                                                />
                                            ) : (
                                                <div className="user-dropdown-card-avatar-placeholder">
                                                    {getInitials(user.name)}
                                                </div>
                                            )}
                                            <div className="user-dropdown-card-info">
                                                <div className="user-dropdown-card-name">
                                                    <p className="user-dropdown-name">
                                                        {user.name}
                                                    </p>
                                                </div>
                                                <p className="user-dropdown-email">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="user-dropdown-section">
                                            <NavLink
                                                to="/settings/profile"
                                                className="user-dropdown-item"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <svg
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                    />
                                                </svg>
                                                Profile
                                            </NavLink>
                                            <NavLink
                                                to="/settings/api-keys"
                                                className="user-dropdown-item"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <svg
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                                    />
                                                </svg>
                                                API Keys
                                            </NavLink>
                                            <NavLink
                                                to="/settings/webhooks"
                                                className="user-dropdown-item"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <svg
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                                    />
                                                </svg>
                                                Webhooks
                                            </NavLink>
                                            <NavLink
                                                to="/plugins"
                                                className="user-dropdown-item"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <svg
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                                                    />
                                                </svg>
                                                Plugins
                                            </NavLink>
                                        </div>
                                        <div className="user-dropdown-divider" />
                                        <div className="user-dropdown-section">
                                            <button
                                                onClick={() => {
                                                    setIsDropdownOpen(false);
                                                    logout();
                                                }}
                                                className="user-dropdown-item user-dropdown-item--logout"
                                            >
                                                <svg
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={1.5}
                                                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                                    />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <NavLink className="header-sign-in" to="/login">
                                Sign In
                            </NavLink>
                        )}

                        <button
                            className="mobile-menu-trigger"
                            onClick={() => setIsMobileDrawerOpen(true)}
                            aria-label="Open menu"
                        >
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {isMobileDrawerOpen && (
                <>
                    <div className="mobile-drawer-overlay" onClick={closeMobileDrawer} />
                    <div className="mobile-drawer">
                        <div className="mobile-drawer-header">
                            <span className="mobile-drawer-brand">Rasbur</span>
                            <button
                                className="mobile-drawer-close"
                                onClick={closeMobileDrawer}
                                aria-label="Close menu"
                            >
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <nav className="mobile-drawer-nav">
                            {navLinks.map((link) => {
                                const handleMobileClick = (e: React.MouseEvent) => {
                                    if (link.to.startsWith('/#')) {
                                        const id = link.to.substring(2);
                                        if (location.pathname === '/') {
                                            e.preventDefault();
                                            const element = document.getElementById(id);
                                            if (element) {
                                                element.scrollIntoView({
                                                    behavior: 'smooth',
                                                    block: 'start',
                                                });
                                                window.history.pushState(null, '', link.to);
                                            }
                                        }
                                    }
                                    closeMobileDrawer();
                                };
                                return (
                                    <NavLink
                                        key={link.to}
                                        className={() => {
                                            const isLinkActive = link.to.includes('#')
                                                ? location.pathname === '/' &&
                                                  location.hash === link.to.substring(1)
                                                : location.pathname === link.to;
                                            return isLinkActive
                                                ? 'mobile-nav-link is-active'
                                                : 'mobile-nav-link';
                                        }}
                                        to={link.to}
                                        end={link.end}
                                        onClick={handleMobileClick}
                                    >
                                        {link.label}
                                    </NavLink>
                                );
                            })}
                        </nav>
                        <div className="mobile-drawer-divider" />
                        <div className="mobile-drawer-auth">
                            {isAuthenticated && user ? (
                                <div
                                    className="user-dropdown-card"
                                    style={{ border: 'none', padding: 0 }}
                                >
                                    {user.avatar ? (
                                        <img
                                            className="user-dropdown-card-avatar"
                                            src={user.avatar}
                                            alt={user.name}
                                        />
                                    ) : (
                                        <div className="user-dropdown-card-avatar-placeholder">
                                            {getInitials(user.name)}
                                        </div>
                                    )}
                                    <div className="user-dropdown-card-info">
                                        <div className="user-dropdown-card-name">
                                            <p className="user-dropdown-name">{user.name}</p>
                                        </div>
                                        <p className="user-dropdown-email">{user.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <NavLink
                                    className="mobile-sign-in-btn"
                                    to="/login"
                                    onClick={closeMobileDrawer}
                                >
                                    Sign In
                                </NavLink>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Global Command Palette dialog */}
            {isCmdPaletteOpen && (
                <div className="cmd-palette-overlay" onClick={() => setIsCmdPaletteOpen(false)}>
                    <div className="cmd-palette-dialog" onClick={(e) => e.stopPropagation()}>
                        <div className="cmd-palette-search-wrapper">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                                <path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                ref={cmdInputRef}
                                className="cmd-palette-input"
                                type="text"
                                placeholder="Type a command or search decoders..."
                                value={cmdSearchQuery}
                                onChange={(e) => setCmdSearchQuery(e.target.value)}
                                onKeyDown={handleCmdPaletteKeyDown}
                            />
                            <span className="cmd-palette-esc-hint">ESC</span>
                        </div>
                        <div className="cmd-palette-list">
                            {filteredItems.length > 0 ? (
                                (() => {
                                    let lastCategory = '';
                                    let globalItemIndex = 0;
                                    return filteredItems.map((item) => {
                                        const isSelected = globalItemIndex === activeIndex;
                                        const currentCategory = item.category;
                                        const showCategory = currentCategory !== lastCategory;
                                        lastCategory = currentCategory;

                                        const itemIndex = globalItemIndex;
                                        globalItemIndex++;

                                        return (
                                            <div key={item.id}>
                                                {showCategory && (
                                                    <div className="cmd-palette-category">
                                                        {currentCategory}
                                                    </div>
                                                )}
                                                <div
                                                    className={`cmd-palette-item ${isSelected ? 'is-active' : ''}`}
                                                    onClick={() => {
                                                        item.perform();
                                                        setIsCmdPaletteOpen(false);
                                                        setCmdSearchQuery('');
                                                    }}
                                                    onMouseEnter={() => setActiveIndex(itemIndex)}
                                                >
                                                    <div className="cmd-palette-item-left">
                                                        <svg
                                                            className="cmd-palette-item-icon"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            {item.category === 'Navigation' ? (
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                                                                />
                                                            ) : item.category === 'Account' ? (
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                />
                                                            ) : (
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={2}
                                                                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                                                                />
                                                            )}
                                                        </svg>
                                                        <span>{item.label}</span>
                                                    </div>
                                                    <span className="cmd-palette-shortcut">
                                                        {item.shortcut}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <div className="cmd-palette-empty">
                                    No results found for "{cmdSearchQuery}"
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Feature Locked Modal dialog */}
            {isLockedModalOpen && (
                <div className="locked-modal-overlay" onClick={() => setIsLockedModalOpen(false)}>
                    <div className="locked-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="locked-modal-icon-wrapper">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect
                                    x="3"
                                    y="11"
                                    width="18"
                                    height="11"
                                    rx="2"
                                    ry="2"
                                    strokeWidth={2}
                                />
                                <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth={2} />
                            </svg>
                        </div>
                        <h3 className="locked-modal-title">Unlock {lockedFeatureName}</h3>
                        <p className="locked-modal-desc">
                            {lockedFeatureName === 'History'
                                ? 'Track your previous decoding pipelines, restore old sessions, and share multi-layered decodes with your team.'
                                : 'Extend your workspace with community pipelines, run WASM modules, or connect custom private endpoint decoders.'}
                        </p>

                        <div className="locked-modal-benefits">
                            <div className="locked-modal-benefit-item">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>
                                    {lockedFeatureName === 'History'
                                        ? 'Unlimited Session Storage'
                                        : 'Access to 50+ Custom Plugins'}
                                </span>
                            </div>
                            <div className="locked-modal-benefit-item">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>
                                    {lockedFeatureName === 'History'
                                        ? 'One-Click Pipeline Restoration'
                                        : 'WASM & REST SDK Support'}
                                </span>
                            </div>
                            <div className="locked-modal-benefit-item">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                <span>Secure Shared Workspaces</span>
                            </div>
                        </div>

                        <div className="locked-modal-actions">
                            <button
                                className="locked-modal-primary-btn"
                                onClick={() => {
                                    setIsLockedModalOpen(false);
                                    navigate('/login');
                                }}
                            >
                                Sign In or Register Free
                            </button>
                            <button
                                className="locked-modal-secondary-btn"
                                onClick={() => setIsLockedModalOpen(false)}
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="app-content">
                <Outlet />
            </div>
        </div>
    );
}
