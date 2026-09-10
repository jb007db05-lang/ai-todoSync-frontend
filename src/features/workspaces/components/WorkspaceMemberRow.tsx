import React, { useState } from 'react';
import { Trash2, Shield } from 'lucide-react';
import type { WorkspaceMember, WorkspaceRole } from '../types/workspace';
import { ROLE_HIERARCHY } from '../types/workspace';

interface WorkspaceMemberRowProps {
  member: WorkspaceMember;
  currentUserId: string;
  currentUserRole: WorkspaceRole;
  onUpdateRole: (userId: string, role: WorkspaceRole) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
}

const ASSIGNABLE_ROLES: WorkspaceRole[] = ['ADMIN', 'MANAGER', 'MEMBER', 'GUEST'];

const ROLE_COLORS: Record<WorkspaceRole, string> = {
  OWNER: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  ADMIN: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  MANAGER: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  MEMBER: 'text-slate-300 bg-slate-700/50 border-slate-600/50',
  GUEST: 'text-slate-500 bg-slate-800/50 border-slate-700/50',
};

export function WorkspaceMemberRow({
  member,
  currentUserId,
  currentUserRole,
  onUpdateRole,
  onRemove,
}: WorkspaceMemberRowProps): JSX.Element {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const isSelf = member.userId === currentUserId;
  const actorRank = ROLE_HIERARCHY[currentUserRole];
  const targetRank = ROLE_HIERARCHY[member.role];
  const canModify = actorRank > targetRank && !isSelf && currentUserRole !== 'MEMBER' && currentUserRole !== 'GUEST';
  const canAssignOwner = currentUserRole === 'OWNER';

  const availableRoles = canAssignOwner
    ? (['OWNER', ...ASSIGNABLE_ROLES] as WorkspaceRole[])
    : ASSIGNABLE_ROLES;

  const handleRoleChange = async (newRole: WorkspaceRole) => {
    if (!canModify && !(canAssignOwner && newRole === 'OWNER')) return;
    setIsUpdating(true);
    try {
      await onUpdateRole(member.userId, newRole);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (!canModify) return;
    setIsRemoving(true);
    try {
      await onRemove(member.userId);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-800 bg-slate-800/30 hover:bg-slate-800/50 transition group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-slate-300">
            {(member.name || member.email).charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-200 truncate">
              {member.name || 'Unknown'}
            </span>
            {isSelf && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 border border-slate-600">
                You
              </span>
            )}
            {member.role === 'OWNER' && (
              <Shield className="w-3 h-3 text-yellow-400 flex-shrink-0" />
            )}
          </div>
          <div className="text-xs text-slate-500 truncate">{member.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {canModify ? (
          <select
            value={member.role}
            onChange={(e) => void handleRoleChange(e.target.value as WorkspaceRole)}
            disabled={isUpdating}
            className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
          >
            {availableRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        ) : (
          <span className={`text-[10px] font-bold px-2 py-1 rounded border ${ROLE_COLORS[member.role]}`}>
            {member.role}
          </span>
        )}

        {canModify && (
          <button
            onClick={() => void handleRemove()}
            disabled={isRemoving}
            title="Remove member"
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default WorkspaceMemberRow;
