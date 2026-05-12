import { FormEvent, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { TASK_WORKFLOW_STATUS_OPTIONS, type TaskWorkflowStatus } from '@/types/task';
import type { ProjectMember } from '@/types/project';
import UserAvatar from './UserAvatar';

interface SubtaskDraft {
  id: string;
  title: string;
  description?: string;
  note?: string;
  status: TaskWorkflowStatus;
  assignedToUserId?: string | null;
}

interface SubtaskFormProps {
  onSubmit: (payload: Array<{ title: string; description?: string; note?: string; status: TaskWorkflowStatus; assignedToUserId?: string | null }>) => Promise<void>;
  members: ProjectMember[];
}

const createDraft = (): SubtaskDraft => ({
  id: crypto.randomUUID(),
  title: '',
  description: '',
  note: '',
  status: 'TODO',
  assignedToUserId: null
});

const inputCls = 'w-full bg-white/82  border border-olive-200  rounded-md text-olive-950  px-4 py-3.5 transition-all duration-200 focus:outline-none focus:border-olive-500  focus:ring-2 focus:ring-olive-500/10';

function SubtaskForm({ onSubmit, members }: SubtaskFormProps): JSX.Element {
  const [drafts, setDrafts] = useState<SubtaskDraft[]>([createDraft()]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateDraft = (draftId: string, field: keyof Omit<SubtaskDraft, 'id'>, value: string | null): void => {
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
        note: draft.note?.trim() || undefined,
        status: draft.status,
        assignedToUserId: draft.assignedToUserId
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
          note: draft.note,
          status: draft.status,
          assignedToUserId: draft.assignedToUserId
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
            className="bg-olive-50/92  border border-olive-200/60  rounded-lg grid gap-3.5 p-4"
          >
            {/* Head */}
            <div className="flex items-center justify-between gap-3">
              <strong className="text-olive-900  text-sm">Sub-task {index + 1}</strong>
              <button
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white  border border-red-200  text-red-600  rounded hover:bg-red-50  disabled:opacity-50 transition-colors"
                disabled={submitting || drafts.length === 1}
                onClick={() => handleRemoveDraft(draft.id)}
                type="button"
              >
                <Trash2 size={14} /> Remove
              </button>
            </div>

            <label className="grid gap-2 text-sm font-medium text-olive-700 ">
              <span>Sub-task title</span>
              <input
                className={inputCls}
                onChange={(event) => updateDraft(draft.id, 'title', event.target.value)}
                placeholder="Write tests"
                type="text"
                value={draft.title}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-olive-700 ">
              <span>Description</span>
              <input
                className={inputCls}
                onChange={(event) => updateDraft(draft.id, 'description', event.target.value)}
                placeholder="Optional description"
                type="text"
                value={draft.description}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-olive-700 ">
              <span>Internal Note</span>
              <input
                className={inputCls}
                onChange={(event) => updateDraft(draft.id, 'note', event.target.value)}
                placeholder="Optional private note"
                type="text"
                value={draft.note}
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-olive-700 ">
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

            <label className="grid gap-2 text-sm font-medium text-olive-700 ">
              <span>Assign To</span>
              <div className="flex items-center gap-3">
                <select
                  className={`${inputCls} !py-2.5`}
                  onChange={(event) => updateDraft(draft.id, 'assignedToUserId', event.target.value || null)}
                  value={draft.assignedToUserId || ''}
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.userId}>
                      {member.user.name || member.user.email}
                    </option>
                  ))}
                </select>
                {draft.assignedToUserId && (
                  <UserAvatar 
                    name={members.find(m => m.userId === draft.assignedToUserId)?.user.name || null}
                    email={members.find(m => m.userId === draft.assignedToUserId)?.user.email || ''}
                    size="md"
                    showTooltip={false}
                  />
                )}
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-3">
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white  border border-olive-200  rounded text-olive-700  text-sm hover:bg-olive-50  disabled:opacity-50 transition-colors"
          disabled={submitting}
          onClick={handleAddDraft}
          type="button"
        >
          <Plus size={16} /> Add another sub-task
        </button>
        <button
          className="px-4 py-2 bg-olive-900  text-white rounded text-sm font-medium hover:bg-olive-800  disabled:opacity-50 transition-colors"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Creating sub-tasks...' : 'Create sub-tasks'}
        </button>
      </div>

      {errorMessage ? <p className="text-red-600  m-0 text-[0.9rem]">{errorMessage}</p> : null}
    </form>
  );
}

export default SubtaskForm;