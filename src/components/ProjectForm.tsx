import { FormEvent, useState } from 'react';

interface ProjectFormProps {
  initialDescription?: string;
  initialName?: string;
  onSubmit: (payload: { name: string; description?: string }) => Promise<void>;
  submitLabel?: string;
}

function ProjectForm({
  initialDescription = '',
  initialName = '',
  onSubmit,
  submitLabel = 'Create project'
}: ProjectFormProps): JSX.Element {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
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
      await onSubmit({ 
        name: name.trim(),
        description: description.trim() || undefined
      });
      setName(initialName);
      setDescription(initialDescription);
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
      <label>
        <span>Description</span>
        <textarea
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional project context"
          rows={3}
          value={description}
        />
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? 'Saving...' : submitLabel}
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </form>
  );
}

export default ProjectForm;
