import React from 'react';
import {
  Folder,
  Plus,
  Settings,
  Activity,
  BrainCircuit,
  LogOut,
  BookOpen,
  Target,
  Plug
} from 'lucide-react';
import logoImg from '@/assets/logo.png';

export type SidebarView = 'dashboard' | 'settings' | 'event-tracking' | 'semantic-intelligence' | 'sdk-docs' | 'engagement' | 'sdk-integrations';

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
    <aside className="flex flex-col w-[260px] shrink-0 bg-slate-50  border-r border-zinc-200  h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)]  z-10 transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-zinc-200  shrink-0">
        <img src={logoImg} alt="Pristine Logo" className="w-6 h-6 object-contain" />
        <span className="font-['Outfit'] font-extrabold text-olive-950  text-[1.25rem] tracking-tight">Pristine</span>
      </div>

      {/* Project nav */}
      <div className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto">
        <p className="text-[0.7rem] uppercase tracking-widest text-zinc-400  font-bold px-3 pt-2 pb-2">Workspace</p>
        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            selectedProjectView === allProjectsValue && activeView === 'dashboard'
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
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
            activeView === 'semantic-intelligence'
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
          ].join(' ')}
          onClick={() => onViewChange('semantic-intelligence')}
          title="Semantic Intelligence"
          type="button"
        >
          <BrainCircuit size={18} strokeWidth={2} />
          <span>Intelligence</span>
        </button>


        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            activeView === 'event-tracking'
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
          ].join(' ')}
          onClick={() => onViewChange('event-tracking')}
          title="Event Tracking"
          type="button"
        >
          <Activity size={18} strokeWidth={2} />
          <span>Event Tracking</span>
        </button>

        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            activeView === 'engagement'
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
          ].join(' ')}
          onClick={() => onViewChange('engagement')}
          title="Guides and Surveys"
          type="button"
        >
          <Target size={18} strokeWidth={2} />
          <span>Engagement</span>
        </button>


        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            activeView === 'sdk-integrations'
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
          ].join(' ')}
          onClick={() => onViewChange('sdk-integrations')}
          title="SDK Integrations"
          type="button"
        >
          <Plug size={18} strokeWidth={2} />
          <span>SDK Integrations</span>
        </button>

        <button
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-olive-600 hover:text-olive-700 hover:bg-olive-50   transition-all duration-200 justify-start mt-1 border border-dashed border-olive-200 "
          onClick={onNewProject}
          type="button"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>New Project</span>
        </button>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-1 p-4 border-t border-zinc-200  shrink-0">
        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            activeView === 'sdk-docs'
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
          ].join(' ')}
          onClick={() => onViewChange('sdk-docs')}
          title="SDK Documentation"
          type="button"
        >
          <BookOpen size={18} strokeWidth={2} />
          <span>SDK Documentation</span>
        </button>

        <button
          className={[
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
            activeView === 'settings'
              ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
              : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
          ].join(' ')}
          onClick={() => onViewChange('settings')}
          title="Settings"
          type="button"
        >
          <Settings size={18} strokeWidth={2} />
          <span>Settings</span>
        </button>

        <button
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50    transition-all duration-200 justify-start mt-1"
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
