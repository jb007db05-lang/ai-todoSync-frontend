import React, { useState } from 'react';
import { Users, UserPlus, RefreshCw, AlertCircle } from 'lucide-react';
import { WorkspaceMemberRow } from './WorkspaceMemberRow';
import { InviteMemberDialog } from './InviteMemberDialog';
import { useWorkspaceMembers } from '../hooks/useWorkspaceMembers';
import type { Workspace, WorkspaceRole } from '../types/workspace';
import { isAtLeastAdmin } from '../types/workspace';

interface WorkspaceMembersProps {
  workspace: Workspace;
  currentUserId: string;
}

export function WorkspaceMembers({ workspace, currentUserId }: WorkspaceMembersProps): JSX.Element {
  const { members, isLoading, error, refreshMembers, inviteMember, updateMemberRole, removeMember } =
    useWorkspaceMembers(workspace.id);
  const [showInvite, setShowInvite] = useState(false);

  const canInvite = isAtLeastAdmin(workspace.role);

  const handleInvite = async (email: string, role: WorkspaceRole) => {
    await inviteMember(email, role);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-200">
            Members <span className="text-slate-500 font-normal">({members.length})</span>
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void refreshMembers()}
            disabled={isLoading}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {canInvite && (
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
            >
              <UserPlus className="w-3 h-3" />
              Invite
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-950/30 border border-red-800/40 rounded-lg text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {isLoading && members.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">Loading members…</div>
      ) : members.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500">No members found</div>
      ) : (
        <div className="space-y-1.5">
          {members.map((m) => (
            <WorkspaceMemberRow
              key={m.id}
              member={m}
              currentUserId={currentUserId}
              currentUserRole={workspace.role}
              onUpdateRole={updateMemberRole}
              onRemove={removeMember}
            />
          ))}
        </div>
      )}

      {showInvite && (
        <InviteMemberDialog
          workspaceName={workspace.name}
          onClose={() => setShowInvite(false)}
          onInvite={handleInvite}
        />
      )}
    </div>
  );
}

export default WorkspaceMembers;
