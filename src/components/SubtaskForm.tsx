import { FormEvent, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { TASK_WORKFLOW_STATUS_OPTIONS, type TaskWorkflowStatus } from '@/types/task';

interface SubtaskDraft {
  id: string;
  title: string;
  status: TaskWorkflowStatus;
}

interface SubtaskFormProps {
  onSubmit: (payload: Array<{ title: string; status: TaskWorkflowStatus }>) => Promise<void>;
}

const createDraft = (): SubtaskDraft => ({
  id: crypto.randomUUID(),
  title: '',
  status: 'pending'
});

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
    <form className="form" onSubmit={(event) => void handleSubmit(event)}>
      <div className="subtask-builder-list">
        {drafts.map((draft, index) => (
          <div className="subtask-builder-card" key={draft.id}>
            <div className="subtask-builder-head">
              <strong>Sub-task {index + 1}</strong>
              <button
                className="danger-button ghost-button"
                disabled={submitting || drafts.length === 1}
                onClick={() => handleRemoveDraft(draft.id)}
                type="button"
              >
                <Trash2 size={16} />
                Remove
              </button>
            </div>
            <label>
              <span>Sub-task title</span>
              <input
                onChange={(event) => updateDraft(draft.id, 'title', event.target.value)}
                placeholder="Write tests"
                type="text"
                value={draft.title}
              />
            </label>
            <label>
              <span>Status</span>
              <select
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
      <div className="subtask-builder-actions">
        <button className="secondary-button" disabled={submitting} onClick={handleAddDraft} type="button">
          <Plus size={16} />
          Add another sub-task
        </button>
        <button disabled={submitting} type="submit">
          {submitting ? 'Creating sub-tasks...' : 'Create sub-tasks'}
        </button>
      </div>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </form>
  );
}

export default SubtaskForm;
