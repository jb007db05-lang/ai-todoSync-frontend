import { FormEvent, useState } from 'react';

interface AddTaskFormProps {
  date: string;
  onCreateTask: (payload: { title: string; description?: string }) => Promise<void>;
}

function AddTaskForm({ date, onCreateTask }: AddTaskFormProps): JSX.Element {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (title.trim() === '') {
      setErrorMessage('Task title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined
      });
      setTitle('');
      setDescription('');
      setSuccessMessage(`Task created for ${date}.`);
    } catch {
      setErrorMessage('Unable to create the task right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="task-form-block" style={{ width: "50%" }}>
      <form className="form" onSubmit={(event) => void handleSubmit(event)}>
        <label>
          <span>Task title</span>
          <input
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Plan tomorrow's sync flow"
            required
            type="text"
            value={title}
          />
        </label>
        <label>
          <span>Description</span>
          <input
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional details"
            type="text"
            value={description}
          />
        </label>
        <button disabled={submitting} type="submit">
          {submitting ? 'Creating task...' : 'Create task'}
        </button>
      </form>
      {successMessage ? <p className="success-text">{successMessage}</p> : null}
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </div>
  );
}

export default AddTaskForm;
