import { FormEvent, useState } from 'react';

import { EPIC_STATUS_OPTIONS, type EpicStatus } from '@/types/epic';

interface EpicFormProps {
  initialDescription?: string;
  initialName?: string;
  initialStatus?: EpicStatus;
  onSubmit: (payload: { description?: string; name: string; status: EpicStatus }) => Promise<void>;
  submitLabel?: string;
}

function EpicForm({
  initialDescription = '',
  initialName = '',
  initialStatus = 'planned',
  onSubmit,
  submitLabel = 'Save epic'
}: EpicFormProps): JSX.Element {
  const [name, setName] = useState<string>(initialName);
  const [description, setDescription] = useState<string>(initialDescription);
  const [status, setStatus] = useState<EpicStatus>(initialStatus);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (name.trim() === '') {
      setErrorMessage('Epic name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        status
      });
    } catch {
      setErrorMessage('Unable to save the epic right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        <span>Epic name</span>
        <input onChange={(event) => setName(event.target.value)} placeholder="Launch workflow cleanup" type="text" value={name} />
      </label>
      <label>
        <span>Description</span>
        <textarea
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional context for the tasks grouped under this epic"
          rows={4}
          value={description}
        />
      </label>
      <label>
        <span>Status</span>
        <select onChange={(event) => setStatus(event.target.value as EpicStatus)} value={status}>
          {EPIC_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? 'Saving epic...' : submitLabel}
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </form>
  );
}

export default EpicForm;
