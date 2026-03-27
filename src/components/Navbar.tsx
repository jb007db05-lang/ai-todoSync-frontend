import { Link, NavLink } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

function Navbar(): JSX.Element {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <Link className="navbar-logo" to="/">
          AI TodoSync
        </Link>
        <p className="muted-text">{user?.email ?? 'Authenticated user'}</p>
      </div>
      <nav className="navbar-links">
        <NavLink className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')} to="/">
          Dashboard
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? 'nav-link nav-link-active' : 'nav-link')}
          to="/settings"
        >
          Settings
        </NavLink>
        <button
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="theme-toggle"
          onClick={toggleTheme}
          type="button"
        >
          <span className="theme-toggle-track">
            <span className={`theme-toggle-thumb theme-toggle-thumb-${theme}`}>{theme === 'light' ? <Moon style={{ color: "black", height: "100%", width: "100%" }} /> : <Sun style={{ color: "white", height: "100%", width: "100%" }} />}</span>
          </span>
        </button>
        <button className="secondary-button" onClick={logout} type="button">
          Sign out
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
