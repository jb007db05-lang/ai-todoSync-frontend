import { FormEvent, useState } from 'react';

import { EPIC_STATUS_OPTIONS, type EpicStatus } from '@/types/epic';

interface EpicFormProps {
  initialDescription?: string;
  initialName?: string;
  initialStatus?: EpicStatus;
  onSubmit: (payload: { description?: string; name: string; status: EpicStatus }) => Promise<void>;
  submitLabel?: string;
}

const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-olive-950 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none focus:border-olive-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-olive-500/10';
const labelCls = 'grid gap-2 font-medium text-[0.95rem] text-olive-950 dark:text-slate-100';

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
    <form className="grid gap-[18px] mt-6" onSubmit={(event) => void handleSubmit(event)}>
      <label className={labelCls}>
        <span>Epic name</span>
        <input className={inputCls} onChange={(event) => setName(event.target.value)} placeholder="Launch workflow cleanup" type="text" value={name} />
      </label>

      <label className={labelCls}>
        <span>Description</span>
        <textarea
          className={`${inputCls} min-h-[112px] resize-y`}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional context for the tasks grouped under this epic"
          rows={4}
          value={description}
        />
      </label>

      <label className={labelCls}>
        <span>Status</span>
        <select className={inputCls} onChange={(event) => setStatus(event.target.value as EpicStatus)} value={status}>
          {EPIC_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button
        className="bg-olive-900 dark:bg-olive-600 text-white rounded-md px-4 py-2.5 text-[0.9rem] font-medium hover:bg-olive-800 dark:hover:bg-olive-500 disabled:opacity-50 transition-colors"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Saving epic...' : submitLabel}
      </button>

      {errorMessage ? <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{errorMessage}</p> : null}
    </form>
  );
}

export default EpicForm;
