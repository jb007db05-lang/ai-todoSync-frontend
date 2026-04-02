import { FormEvent, useState } from 'react';

import { TASK_WORKFLOW_STATUS_OPTIONS, type TaskWorkflowStatus } from '@/types/task';

interface SubtaskFormProps {
  onSubmit: (payload: { title: string; note?: string; status: TaskWorkflowStatus }) => Promise<void>;
}

function SubtaskForm({ onSubmit }: SubtaskFormProps): JSX.Element {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<TaskWorkflowStatus>('pending');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Subtask title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({ title: title.trim(), note: note.trim() || undefined, status });
      setTitle('');
      setNote('');
      setStatus('pending');
    } catch {
      setErrorMessage('Unable to create the subtask right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        <span>Subtask title</span>
        <input onChange={(event) => setTitle(event.target.value)} placeholder="Write tests" type="text" value={title} />
      </label>
      <label>
        <span>Status</span>
        <select onChange={(event) => setStatus(event.target.value as TaskWorkflowStatus)} value={status}>
          {TASK_WORKFLOW_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Subtask note</span>
        <textarea
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional implementation details"
          rows={4}
          value={note}
        />
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? 'Creating subtask...' : 'Create subtask'}
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </form>
  );
}

export default SubtaskForm;
