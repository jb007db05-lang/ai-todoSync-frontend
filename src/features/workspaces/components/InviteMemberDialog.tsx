import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import type { WorkspaceRole } from '../types/workspace';

interface InviteMemberDialogProps {
  workspaceName: string;
  onClose: () => void;
  onInvite: (email: string, role: WorkspaceRole) => Promise<void>;
}

const ROLES: WorkspaceRole[] = ['ADMIN', 'MANAGER', 'MEMBER', 'GUEST'];

export function InviteMemberDialog({
  workspaceName,
  onClose,
  onInvite,
}: InviteMemberDialogProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<WorkspaceRole>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onInvite(email.trim().toLowerCase(), role);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-slate-400/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Invite Member</h3>
              <p className="text-xs text-slate-400">{workspaceName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 text-sm text-red-600 bg-red-50 border border-red-200/80 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@example.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-emerald-500/20"
            >
              {loading ? 'Sending…' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteMemberDialog;
