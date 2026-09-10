import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import { useWorkspace } from '../context/WorkspaceContext';
import type { Workspace, WorkspaceRole } from '../types/workspace';
import { isAtLeastAdmin } from '../types/workspace';

interface WorkspaceGeneralSettingsProps {
  workspace: Workspace;
}

export function WorkspaceGeneralSettings({ workspace }: WorkspaceGeneralSettingsProps): JSX.Element {
  const { refreshWorkspaces } = useWorkspace();
  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [defaultRole, setDefaultRole] = useState<WorkspaceRole>('MEMBER');
  const [allowGuests, setAllowGuests] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canEdit = isAtLeastAdmin(workspace.role);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');
    try {
      await workspaceService.updateWorkspace(workspace.id, {
        name: name.trim(),
        slug: slug.trim(),
        settings: { defaultProjectRole: defaultRole, allowGuestInvites: allowGuests },
      });
      await refreshWorkspaces();
      setSuccess('Workspace settings saved.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {error && (
        <div className="px-3 py-2.5 text-sm text-red-400 bg-red-950/40 border border-red-800/40 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="px-3 py-2.5 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^\w-]/g, ''))}
            disabled={!canEdit}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-400 font-mono focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          Default Project Role for New Members
        </label>
        <select
          value={defaultRole}
          onChange={(e) => setDefaultRole(e.target.value as WorkspaceRole)}
          disabled={!canEdit}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
        >
          {['ADMIN', 'MANAGER', 'MEMBER', 'GUEST'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div>
          <div className="text-sm font-medium text-slate-200">Allow Guest Invites</div>
          <div className="text-xs text-slate-500 mt-0.5">Let admins invite users with limited guest access</div>
        </div>
        <button
          type="button"
          onClick={() => setAllowGuests((v) => !v)}
          disabled={!canEdit}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            allowGuests ? 'bg-blue-600' : 'bg-slate-600'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
              allowGuests ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-lg text-sm transition"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      )}
    </form>
  );
}

export default WorkspaceGeneralSettings;
