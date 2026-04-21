import React from 'react';
import {
  Layout,
  Folder,
  Plus,
  Settings,
  Activity,
  LogOut
} from 'lucide-react';

export type SidebarView = 'dashboard' | 'settings' | 'event-tracking';

interface SidebarProps {
  activeView: SidebarView;
  selectedProjectView: string;
  allProjectsValue: string;
  onProjectSelect: (projectId: string) => void;
  onViewChange: (view: SidebarView) => void;
  onNewProject: () => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  selectedProjectView,
  allProjectsValue,
  onProjectSelect,
  onViewChange,
  onNewProject,
  onLogout
}) => {
  return (
    <aside className="flex flex-col w-[260px] shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-zinc-200 dark:border-slate-800 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none z-10 transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-zinc-200 dark:border-slate-800 shrink-0">
        <Layout className="text-olive-600 dark:text-olive-500" size={24} strokeWidth={2.5} />
        <span className="font-['Outfit'] font-extrabold text-olive-950 dark:text-white text-[1.25rem] tracking-tight">Task Manager</span>
      </div>

      {/* Project nav */}
      <div className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto">
        <p className="text-[0.7rem] uppercase tracking-widest text-zinc-400 dark:text-slate-500 font-bold px-3 pt-2 pb-2">Workspace</p>
        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            selectedProjectView === allProjectsValue && activeView !== 'settings' && activeView !== 'event-tracking'
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20' 
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
          ].join(' ')}
          onClick={() => onProjectSelect(allProjectsValue)}
          type="button"
        >
          <Folder size={18} strokeWidth={2} />
          <span>All Projects</span>
        </button>


        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            activeView === 'event-tracking' 
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20' 
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
          ].join(' ')}
          onClick={() => onViewChange('event-tracking')}
          title="Event Tracking"
          type="button"
        >
          <Activity size={18} strokeWidth={2} />
          <span>Event Tracking</span>
        </button>

        <button
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-olive-600 hover:text-olive-700 hover:bg-olive-50 dark:text-olive-500 dark:hover:bg-olive-900/40 transition-all duration-200 justify-start mt-1 border border-dashed border-olive-200 dark:border-olive-800"
          onClick={onNewProject}
          type="button"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>New Project</span>
        </button>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 p-4 border-t border-zinc-200 dark:border-slate-800 shrink-0">
        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            activeView === 'settings' 
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20' 
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
          ].join(' ')}
          onClick={() => onViewChange('settings')}
          title="Settings"
          type="button"
        >
          <Settings size={18} strokeWidth={2} />
          <span>Settings</span>
        </button>

        <button 
           className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 justify-start mt-1"
           onClick={onLogout} 
           title="Sign out" 
           type="button"
        >
          <LogOut size={18} strokeWidth={2} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
