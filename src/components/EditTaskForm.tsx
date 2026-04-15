import { FormEvent, useState } from 'react';

import type { Epic } from '@/types/epic';
import type { Project } from '@/types/project';
import { TASK_WORKFLOW_STATUS_OPTIONS, type Task, type TaskStatus, type TaskWorkflowStatus } from '@/types/task';

interface EditTaskFormProps {
  epics: Epic[];
  onSubmit: (payload: {
    title: string;
    description?: string;
    date: string;
    status: TaskWorkflowStatus;
    projectId: string | null;
    epicId: string | null;
  }) => Promise<void>;
  projects: Project[];
  task: Task;
}

const inputCls =
  'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md ' +
  'text-zinc-900 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none ' +
  'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10';
const labelCls = 'grid gap-2 font-medium text-[0.95rem] text-zinc-900 dark:text-slate-100';

function EditTaskForm({ epics, onSubmit, projects, task }: EditTaskFormProps): JSX.Element {
  // Normalise status — rolled_over is stored but not a selectable workflow status
  const initialStatus: TaskWorkflowStatus =
    task.status === 'rolled_over' ? 'pending' : (task.status as TaskWorkflowStatus);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [date, setDate] = useState(task.date);
  const [status, setStatus] = useState<TaskWorkflowStatus>(initialStatus);
  const [projectId, setProjectId] = useState<string>(task.projectId ?? '');
  const [epicId, setEpicId] = useState<string>(task.epicId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // When project changes, clear epic if it no longer belongs to the new project
  const handleProjectChange = (newProjectId: string): void => {
    setProjectId(newProjectId);
    const currentEpic = epics.find((e) => e.id === epicId);
    if (currentEpic && currentEpic.projectId !== newProjectId) {
      setEpicId('');
    }
  };

  // Only show epics that belong to the selected project
  const availableEpics = projectId
    ? epics.filter((e) => e.projectId === projectId)
    : [];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Task title is required.');
      return;
    }

    if (!date) {
      setErrorMessage('Task date is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        date,
        status,
        projectId: projectId || null,
        epicId: epicId || null,
      });
    } catch {
      setErrorMessage('Unable to save the task right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-[18px] mt-2" onSubmit={(e) => void handleSubmit(e)}>
      {/* Title */}
      <label className={labelCls}>
        <span>Title</span>
        <input
          autoFocus
          className={inputCls}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title"
          type="text"
          value={title}
        />
      </label>

      {/* Description */}
      <label className={labelCls}>
        <span>Description <span className="text-zinc-400 dark:text-slate-500 font-normal text-[0.82rem]">(optional)</span></span>
        <textarea
          className={`${inputCls} min-h-[88px] resize-y`}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional context or details"
          rows={3}
          value={description}
        />
      </label>

      {/* Date + Status in a row */}
      <div className="grid grid-cols-2 gap-4">
        <label className={labelCls}>
          <span>Date</span>
          <input
            className={inputCls}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            value={date}
          />
        </label>

        <label className={labelCls}>
          <span>Status</span>
          <select
            className={inputCls}
            onChange={(e) => setStatus(e.target.value as TaskWorkflowStatus)}
            value={status}
          >
            {TASK_WORKFLOW_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Project */}
      <label className={labelCls}>
        <span>Project <span className="text-zinc-400 dark:text-slate-500 font-normal text-[0.82rem]">(optional)</span></span>
        <select
          className={inputCls}
          onChange={(e) => handleProjectChange(e.target.value)}
          value={projectId}
        >
          <option value="">— No project —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </label>

      {/* Epic — only shown when project is selected */}
      {projectId && (
        <label className={labelCls}>
          <span>Epic <span className="text-zinc-400 dark:text-slate-500 font-normal text-[0.82rem]">(optional)</span></span>
          <select
            className={inputCls}
            onChange={(e) => setEpicId(e.target.value)}
            value={epicId}
          >
            <option value="">— No epic —</option>
            {availableEpics.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </label>
      )}

      <button
        className="bg-zinc-900 dark:bg-blue-600 text-white rounded-md px-4 py-2.5 text-[0.9rem] font-medium hover:bg-zinc-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Saving task...' : 'Save task'}
      </button>

      {errorMessage ? (
        <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{errorMessage}</p>
      ) : null}
    </form>
  );
}

export default EditTaskForm;
