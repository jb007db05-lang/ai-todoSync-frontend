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
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100/80 active:bg-slate-100 rounded-xl border border-slate-200/90 transition-all duration-150 gap-2.5 shadow-sm focus:outline-none"
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            <div className="w-5.5 h-5.5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
              )}
            </div>
            <span className="truncate max-w-[140px] text-slate-800 font-medium">
              {activeWorkspace ? activeWorkspace.name : 'Select Workspace'}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-slate-200/90 rounded-xl shadow-xl shadow-slate-200/60 z-50 p-2 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
              Workspaces
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1 scrollbar-thin">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspace?.id;
                const initial = ws.name.trim().charAt(0).toUpperCase() || 'W';
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => {
                      switchWorkspace(ws);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors duration-150 ${
                      isActive
                        ? 'bg-blue-50/80 border border-blue-200/70 text-blue-900'
                        : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md font-bold text-xs flex items-center justify-center flex-shrink-0 ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 border border-blue-200/80'
                            : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}
                      >
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className={`truncate text-xs font-semibold ${isActive ? 'text-blue-950' : 'text-slate-800'}`}>
                          {ws.name}
                        </div>
                        <div className={`text-[10px] truncate ${isActive ? 'text-blue-600/80' : 'text-slate-400'}`}>
                          {ws.memberCount} member{ws.memberCount !== 1 ? 's' : ''} · {ws.role}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}

              {workspaces.length === 0 && !isLoading && (
                <div className="px-3 py-4 text-center text-xs text-slate-400">
                  No workspaces available
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 mt-2 pt-1.5 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowCreate(true);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Create New Workspace</span>
              </button>

              {activeWorkspace && onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Workspace Settings</span>
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
