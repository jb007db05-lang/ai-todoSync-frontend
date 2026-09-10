import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Workspace } from '../types/workspace';

interface WorkspaceDangerZoneProps {
  workspace: Workspace;
}

export function WorkspaceDangerZone({ workspace }: WorkspaceDangerZoneProps): JSX.Element | null {
  const { refreshWorkspaces } = useWorkspace();
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (workspace.role !== 'OWNER') return null;

  const handleDelete = async () => {
    if (confirmName !== workspace.name) {
      setError(`Type "${workspace.name}" to confirm deletion.`);
      return;
    }
    setIsDeleting(true);
    setError('');
    try {
      await workspaceService.deleteWorkspace(workspace.id);
      await refreshWorkspaces();
      // Navigation handled by refreshWorkspaces → workspace list changes
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete workspace');
      setIsDeleting(false);
    }
  };

  return (
    <div className="border border-red-900/40 rounded-xl p-5 bg-red-950/10 space-y-4">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-4.5 h-4.5 text-red-500 flex-shrink-0" />
        <h4 className="text-sm font-bold text-red-400">Danger Zone</h4>
      </div>

      {!showConfirm ? (
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-slate-200">Delete this workspace</div>
            <div className="text-xs text-slate-500 mt-0.5">
              Permanently deletes the workspace and removes all member access. Projects are preserved but unlinked.
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-900/30 hover:bg-red-900/60 border border-red-800/50 text-red-400 hover:text-red-300 text-xs font-semibold rounded-lg transition flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Workspace
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Type <span className="font-bold text-red-400">{workspace.name}</span> to confirm deletion:
          </p>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={workspace.name}
            className="w-full bg-slate-900 border border-red-800/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-red-500 transition"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => { setShowConfirm(false); setConfirmName(''); setError(''); }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleDelete()}
              disabled={isDeleting || confirmName !== workspace.name}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting…' : 'Permanently Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WorkspaceDangerZone;
