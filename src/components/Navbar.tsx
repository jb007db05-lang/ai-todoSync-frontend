import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

function Navbar(): JSX.Element {
  const { logout } = useAuth();

  return (
    <header className="sticky top-6 z-50 flex items-center justify-between gap-4 px-7 py-4 bg-white/82 dark:bg-slate-900/90 backdrop-blur-md border border-zinc-200 dark:border-slate-700 rounded-[20px] shadow-[0_10px_30px_rgba(148,163,184,0.2)]">
      <div className="grid gap-0.5">
        <Link
          className="font-['Outfit'] text-[1.4rem] font-extrabold tracking-[-0.02em] bg-gradient-to-r from-zinc-900 to-slate-500 dark:from-slate-100 dark:to-blue-300 bg-clip-text text-transparent no-underline"
          to="/"
        >
          Task Manager
        </Link>
      </div>

      <nav className="flex items-center gap-4">
        <NavLink
          className={({ isActive }) =>
            [
              'font-semibold no-underline text-[0.95rem] px-3 py-2 rounded-lg transition-all duration-200',
              isActive
                ? 'text-zinc-900 dark:text-white bg-zinc-900/10 dark:bg-slate-300/10'
                : 'text-zinc-500 dark:text-slate-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-900/6'
            ].join(' ')
          }
          to="/"
        >
          Dashboard
        </NavLink>
        <button
          className="px-4 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-700 dark:text-slate-200 text-[0.9rem] font-medium hover:bg-zinc-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
          onClick={logout}
          type="button"
        >
          Sign out
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
