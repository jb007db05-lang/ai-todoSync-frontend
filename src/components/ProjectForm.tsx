import { FormEvent, useState } from 'react';

interface ProjectFormProps {
  onSubmit: (payload: { name: string }) => Promise<void>;
}

function ProjectForm({ onSubmit }: ProjectFormProps): JSX.Element {
  const [name, setName] = useState('');
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
      setName('');
    } catch {
      setErrorMessage('Unable to create the project right now.');
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
        {submitting ? 'Creating project...' : 'Create project'}
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </form>
  );
}

export default ProjectForm;
