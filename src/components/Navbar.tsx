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
          Task Manager
        </Link>
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
        <button className="secondary-button" onClick={logout} type="button">
          Sign out
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
