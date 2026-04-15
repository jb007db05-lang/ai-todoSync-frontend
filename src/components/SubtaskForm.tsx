import { FormEvent, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { TASK_WORKFLOW_STATUS_OPTIONS, type TaskWorkflowStatus } from '@/types/task';

interface SubtaskDraft {
  id: string;
  title: string;
  description?: string;
  status: TaskWorkflowStatus;
}

interface SubtaskFormProps {
  onSubmit: (payload: Array<{ title: string; description?: string; status: TaskWorkflowStatus }>) => Promise<void>;
}

const createDraft = (): SubtaskDraft => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  status: 'pending'
});

const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-zinc-900 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10';

function SubtaskForm({ onSubmit }: SubtaskFormProps): JSX.Element {
  const [drafts, setDrafts] = useState<SubtaskDraft[]>([createDraft()]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateDraft = (draftId: string, field: keyof Omit<SubtaskDraft, 'id'>, value: string): void => {
    setDrafts((current) =>
      current.map((draft) => (draft.id === draftId ? { ...draft, [field]: value } : draft))
    );
  };

  const handleAddDraft = (): void => {
    setDrafts((current) => [...current, createDraft()]);
  };

  const handleRemoveDraft = (draftId: string): void => {
    setDrafts((current) => (current.length === 1 ? current : current.filter((draft) => draft.id !== draftId)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const normalizedDrafts = drafts
      .map((draft) => ({
        title: draft.title.trim(),
        description: draft.description?.trim() || undefined,
        status: draft.status
      }))
      .filter((draft) => draft.title !== '');

    if (normalizedDrafts.length === 0) {
      setErrorMessage('At least one sub-task title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit(
        normalizedDrafts.map((draft) => ({
          title: draft.title,
          description: draft.description,
          status: draft.status
        }))
      );
      setDrafts([createDraft()]);
    } catch {
      setErrorMessage('Unable to create the sub-tasks right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-[18px] mt-6" onSubmit={(event) => void handleSubmit(event)}>
      {/* Builder cards */}
      <div className="grid gap-4">
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className="bg-slate-50/92 dark:bg-slate-800/92 border border-zinc-200/60 dark:border-slate-700 rounded-2xl grid gap-3.5 p-4"
          >
            {/* Head */}
            <div className="flex items-center justify-between gap-3">
              <strong className="text-zinc-800 dark:text-slate-200 text-sm">Sub-task {index + 1}</strong>
              <button
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                disabled={submitting || drafts.length === 1}
                onClick={() => handleRemoveDraft(draft.id)}
                type="button"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>

            <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-slate-300">
              <span>Sub-task title</span>
              <input
                className={inputCls}
                onChange={(event) => updateDraft(draft.id, 'title', event.target.value)}
                placeholder="Write tests"
                type="text"
                value={draft.title}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-slate-300">
              <span>Description</span>
              <input
                className={inputCls}
                onChange={(event) => updateDraft(draft.id, 'description', event.target.value)}
                placeholder="Optional description"
                type="text"
                value={draft.description}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-zinc-700 dark:text-slate-300">
              <span>Status</span>
              <select
                className={inputCls}
                onChange={(event) => updateDraft(draft.id, 'status', event.target.value)}
                value={draft.status}
              >
                {TASK_WORKFLOW_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3">
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-700 dark:text-slate-200 text-sm hover:bg-zinc-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          disabled={submitting}
          onClick={handleAddDraft}
          type="button"
        >
          <Plus size={16} /> Add another sub-task
        </button>
        <button
          className="px-4 py-2 bg-zinc-900 dark:bg-blue-600 text-white rounded text-sm font-medium hover:bg-zinc-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Creating sub-tasks...' : 'Create sub-tasks'}
        </button>
      </div>

      {errorMessage ? <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{errorMessage}</p> : null}
    </form>
  );
}

export default SubtaskForm;
