import React, { useRef, useState, useEffect } from 'react';
import { Building2, Check, ChevronDown, Plus, Settings, Loader2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog';

interface WorkspaceSwitcherProps {
  onOpenSettings?: () => void;
}

export function WorkspaceSwitcher({ onOpenSettings }: WorkspaceSwitcherProps): JSX.Element {
  const { workspaces, activeWorkspace, switchWorkspace, isLoading } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div className="relative" ref={dropRef}>
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-slate-200 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg border border-slate-700/60 transition gap-2"
        >
          <div className="flex items-center gap-2.5 truncate min-w-0">
            <div className="w-5.5 h-5.5 rounded bg-blue-600/25 text-blue-400 flex items-center justify-center flex-shrink-0">
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Building2 className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="truncate text-xs">
              {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-64 bg-slate-900 border border-slate-700/70 rounded-xl shadow-2xl z-50 p-1.5 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Workspaces
            </div>

            <div className="max-h-52 overflow-y-auto space-y-0.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    switchWorkspace(ws);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition ${
                    ws.id === activeWorkspace?.id
                      ? 'bg-blue-600/15 text-blue-300'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-slate-400">
                        {ws.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{ws.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {ws.memberCount} member{ws.memberCount !== 1 ? 's' : ''} · {ws.role}
                      </div>
                    </div>
                  </div>
                  {ws.id === activeWorkspace?.id && (
                    <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))}

              {workspaces.length === 0 && !isLoading && (
                <div className="px-3 py-4 text-center text-xs text-slate-500">
                  No workspaces yet
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 mt-1 pt-1 space-y-0.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowCreate(true);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition text-xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                Create New Workspace
              </button>

              {activeWorkspace && onOpenSettings && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition text-xs"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  Workspace Settings
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateWorkspaceDialog onClose={() => setShowCreate(false)} />}
    </>
  );
}

export default WorkspaceSwitcher;
