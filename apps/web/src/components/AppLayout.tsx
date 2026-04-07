import { NavLink, Outlet } from 'react-router-dom';

export default function AppLayout() {
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
                    </div>
                </div>
            </header>

            <div className="app-content">
                <Outlet />
            </div>
        </div>
    );
}
