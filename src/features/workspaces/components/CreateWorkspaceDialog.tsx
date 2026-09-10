import React, { useState } from 'react';
import { Building2, X } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface CreateWorkspaceDialogProps {
  onClose: () => void;
}

export function CreateWorkspaceDialog({ onClose }: CreateWorkspaceDialogProps): JSX.Element {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const deriveSlug = (n: string) =>
    n.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '').slice(0, 60);

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(deriveSlug(v));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await createWorkspace(name.trim(), slug || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-slate-400/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Create New Workspace</h3>
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
              Workspace Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Acme Product Team"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Slug <span className="text-slate-400 normal-case font-normal">(auto-generated)</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(deriveSlug(e.target.value))}
              placeholder="acme-product-team"
              className="w-full bg-slate-100/60 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-600 font-mono focus:outline-none focus:border-blue-400 transition"
            />
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
              disabled={loading || !name.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-blue-500/20"
            >
              {loading ? 'Creating…' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateWorkspaceDialog;
