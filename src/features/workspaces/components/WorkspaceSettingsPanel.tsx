import React, { useState } from 'react';
import { Settings2, Users, AlertTriangle, Loader2, Building2 } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { WorkspaceGeneralSettings } from './WorkspaceGeneralSettings';
import { WorkspaceMembers } from './WorkspaceMembers';
import { WorkspaceDangerZone } from './WorkspaceDangerZone';
import { useAuth } from '@/context/AuthContext';

type Tab = 'general' | 'members' | 'danger';

interface TabDef {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'general', label: 'General', icon: <Settings2 className="w-3.5 h-3.5" /> },
  { id: 'members', label: 'Members', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'danger', label: 'Danger Zone', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
];

export function WorkspaceSettingsPanel(): JSX.Element {
  const { activeWorkspace, isLoading } = useWorkspace();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('general');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-olive-600 font-sans text-xs">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-olive-700" />
        Loading workspace…
      </div>
    );
  }

  if (!activeWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-olive-600 font-sans">
        <Building2 className="w-9 h-9 opacity-40 text-olive-700" />
        <p className="text-xs font-medium">No workspace selected. Create or select one above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Workspace Info Header */}
      <div className="flex items-center gap-4 p-4 bg-olive-50/60 border border-olive-200 rounded">
        <div className="w-10 h-10 rounded bg-olive-800 text-white flex items-center justify-center flex-shrink-0 font-bold text-base shadow-xs">
          {activeWorkspace.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-olive-950 truncate">{activeWorkspace.name}</h3>
          <div className="flex items-center gap-2.5 mt-0.5">
            <span className="text-[11px] text-olive-600 font-mono">{activeWorkspace.slug}</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-olive-200 border border-olive-300 text-olive-900 font-bold uppercase">
              {activeWorkspace.role}
            </span>
            <span className="text-xs text-olive-600">
              {activeWorkspace.memberCount} member{activeWorkspace.memberCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 border-b border-olive-200 pb-3 text-xs">
        {TABS.map((tab) => {
          if (tab.id === 'danger' && activeWorkspace.role !== 'OWNER') return null;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-olive-800 text-white font-semibold shadow-xs'
                  : 'text-olive-700 hover:bg-olive-100/70 hover:text-olive-950'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <WorkspaceGeneralSettings workspace={activeWorkspace} />
      )}
      {activeTab === 'members' && user && (
        <WorkspaceMembers workspace={activeWorkspace} currentUserId={user.id} />
      )}
      {activeTab === 'danger' && (
        <WorkspaceDangerZone workspace={activeWorkspace} />
      )}
    </div>
  );
}

export default WorkspaceSettingsPanel;
