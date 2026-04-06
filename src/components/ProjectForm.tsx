import { FormEvent, useState } from 'react';

interface ProjectFormProps {
  initialName?: string;
  onSubmit: (payload: { name: string }) => Promise<void>;
  submitLabel?: string;
}

function ProjectForm({
  initialName = '',
  onSubmit,
  submitLabel = 'Create project'
}: ProjectFormProps): JSX.Element {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Project name is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({ name: name.trim() });
      setName(initialName);
    } catch {
      setErrorMessage(`Unable to ${submitLabel.toLowerCase()} right now.`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form" onSubmit={(event) => void handleSubmit(event)}>
      <label>
        <span>Project name</span>
        <input onChange={(event) => setName(event.target.value)} placeholder="Backend" type="text" value={name} />
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? 'Saving...' : submitLabel}
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </form>
  );
}

export default ProjectForm;
