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
  Plug,
  Sparkles,
  Calendar
} from 'lucide-react';
import logoImg from '@/assets/logo.png';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import { Workspace } from '../services/workspaces';

export type SidebarView = 'dashboard' | 'settings' | 'event-tracking' | 'semantic-intelligence' | 'sdk-docs' | 'engagement' | 'sdk-integrations' | 'sdk-integration-detail';

interface SidebarProps {
  activeView: SidebarView;
  selectedProjectView: string;
  allProjectsValue: string;
  currentWorkspaceId?: string;
  onSelectWorkspace?: (workspace: Workspace) => void;
  onProjectSelect: (projectId: string) => void;
  onViewChange: (view: SidebarView, tab?: string) => void;
  onNewProject: () => void;
  onPlanWithAi?: () => void;
  onPlanMyDay?: () => void;
  onLogout: () => void;
  activeIntegrationId?: string;
  activeIntegrationName?: string;
  activeTab?: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  selectedProjectView,
  allProjectsValue,
  currentWorkspaceId,
  onSelectWorkspace,
  onProjectSelect,
  onViewChange,
  onNewProject,
  onPlanWithAi,
  onPlanMyDay,
  onLogout,
  activeIntegrationId,
  activeIntegrationName,
  activeTab
}) => {
  return (
    <aside className="flex flex-col w-[260px] shrink-0 bg-slate-50 border-r border-zinc-200 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 transition-colors duration-300">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 h-[72px] border-b border-zinc-200 shrink-0">
        <img src={logoImg} alt="Pristine Logo" className="w-6 h-6 object-contain" />
        <span className="font-['Outfit'] font-extrabold text-olive-950 text-[1.25rem] tracking-tight">Pristine</span>
      </div>

      {/* Workspace Switcher */}
      {onSelectWorkspace && (
        <div className="p-3 border-b border-zinc-200">
          <WorkspaceSwitcher
            currentWorkspaceId={currentWorkspaceId}
            onSelectWorkspace={onSelectWorkspace}
          />
        </div>
      )}

      {/* Project nav / Integration nav */}
      <div className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto">
        {activeIntegrationId ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-[0.7rem] uppercase tracking-widest text-zinc-400 font-bold px-3 pt-2 pb-1">Integration Workspace</p>
            <div className="px-3 py-2.5 bg-olive-50 rounded-xl border border-olive-100 mb-2 flex flex-col gap-0.5">
              <span className="text-[0.65rem] font-bold text-olive-500 uppercase tracking-wider block">Active Integration</span>
              <span className="text-sm font-bold text-olive-950 flex items-center gap-1.5 truncate">
                <Plug size={14} className="text-olive-600 shrink-0" />
                {activeIntegrationName || 'Loading...'}
              </span>
            </div>

            <button
              className={[
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
                activeTab === 'overview'
                  ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
                  : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
              ].join(' ')}
              onClick={() => onViewChange('sdk-integration-detail', 'overview')}
              type="button"
            >
              <Settings size={18} strokeWidth={2} />
              <span>Overview</span>
            </button>

            <button
              className={[
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
                activeTab === 'guides'
                  ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
                  : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
              ].join(' ')}
              onClick={() => onViewChange('sdk-integration-detail', 'guides')}
              type="button"
            >
              <BookOpen size={18} strokeWidth={2} />
              <span>Guides</span>
            </button>

            <button
              className={[
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
                activeTab === 'surveys'
                  ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
                  : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
              ].join(' ')}
              onClick={() => onViewChange('sdk-integration-detail', 'surveys')}
              type="button"
            >
              <Target size={18} strokeWidth={2} />
              <span>Surveys</span>
            </button>

            <button
              className={[
                'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
                activeTab === 'events'
                  ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20'
                  : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100'
              ].join(' ')}
              onClick={() => onViewChange('sdk-integration-detail', 'events')}
              type="button"
            >
              <Activity size={18} strokeWidth={2} />
              <span>Events</span>
            </button>

            <div className="h-px bg-zinc-200 my-2" />

            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-zinc-500 hover:text-olive-950 hover:bg-zinc-100 transition-all duration-200 justify-start"
              onClick={() => onViewChange('sdk-integrations')}
              type="button"
            >
              <Plug size={18} strokeWidth={2} className="rotate-180" />
              <span>Exit Workspace</span>
            </button>
          </div>
        ) : (
          <>
            <p className="text-[0.7rem] uppercase tracking-widest text-zinc-400 font-bold px-3 pt-2 pb-2">Navigation</p>
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

            {onPlanWithAi && (
              <button
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-semibold text-purple-700 hover:bg-purple-50 transition-all duration-200 justify-start mt-1 border border-purple-200"
                onClick={onPlanWithAi}
                type="button"
              >
                <Sparkles size={18} strokeWidth={2} className="text-purple-600" />
                <span>✨ Plan with AI</span>
              </button>
            )}

            {onPlanMyDay && (
              <button
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-blue-700 hover:bg-blue-50 transition-all duration-200 justify-start border border-blue-200"
                onClick={onPlanMyDay}
                type="button"
              >
                <Calendar size={18} strokeWidth={2} className="text-blue-600" />
                <span>✨ Plan My Day</span>
              </button>
            )}

            <button
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-olive-600 hover:text-olive-700 hover:bg-olive-50 transition-all duration-200 justify-start mt-1 border border-dashed border-olive-200"
              onClick={onNewProject}
              type="button"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>New Project</span>
            </button>
          </>
        )}
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
