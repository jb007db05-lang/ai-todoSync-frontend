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

  const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-olive-950 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-400/16';

  return (
    <form className="grid gap-[18px] mt-6" onSubmit={(event) => void handleSubmit(event)}>
      <label className="grid gap-2 font-medium text-[0.95rem] text-olive-950 dark:text-slate-100">
        <span>Project name</span>
        <input className={inputCls} onChange={(event) => setName(event.target.value)} placeholder="Backend" type="text" value={name} />
      </label>
      <label className="grid gap-2 font-medium text-[0.95rem] text-olive-950 dark:text-slate-100">
        <span>Description</span>
        <textarea
          className={`${inputCls} min-h-[112px] resize-y`}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional project context"
          rows={3}
          value={description}
        />
      </label>
      <button
        className="bg-olive-900 dark:bg-blue-600 text-white rounded-md px-4 py-2.5 text-[0.9rem] font-medium hover:bg-olive-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Saving...' : submitLabel}
      </button>
      {errorMessage ? <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{errorMessage}</p> : null}
    </form>
  );
}

export default ProjectForm;
