import { FormEvent, useState } from 'react';

import type { Epic } from '@/types/epic';
import type { Project } from '@/types/project';
import { TASK_WORKFLOW_STATUS_OPTIONS, type TaskWorkflowStatus } from '@/types/task';
import { flattenProjectOptions } from '@/utils/projectTree';

interface AddTaskFormProps {
  epics: Epic[];
  initialProjectId?: string | null;
  onCreateTask: (payload: {
    title: string;
    description?: string;
    status?: TaskWorkflowStatus;
    projectId?: string | null;
    epicId?: string | null;
  }) => Promise<void>;
  projects: Project[];
}

const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-zinc-900 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10';
const labelCls = 'grid gap-2 font-medium text-[0.95rem] text-zinc-900 dark:text-slate-100';

function AddTaskForm({ epics, initialProjectId = null, onCreateTask, projects }: AddTaskFormProps): JSX.Element {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [status, setStatus] = useState<TaskWorkflowStatus>('pending');
  const [projectId, setProjectId] = useState<string>(initialProjectId ?? '');
  const [epicId, setEpicId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const projectOptions = flattenProjectOptions(projects);
  const visibleEpics = epics.filter((epic) => epic.projectId === projectId).sort((left, right) => left.order - right.order);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (title.trim() === '') {
      setErrorMessage('Task title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        projectId: projectId || undefined,
        epicId: projectId ? epicId || null : null
      });
      setTitle('');
      setDescription('');
      setStatus('pending');
      setProjectId(initialProjectId ?? '');
      setEpicId('');
    } catch {
      setErrorMessage('Unable to create the task right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-[18px] mt-6" onSubmit={(event) => void handleSubmit(event)}>
      <label className={labelCls}>
        <span>Task title</span>
        <input
          className={inputCls}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Plan tomorrow's sync flow"
          required
          type="text"
          value={title}
        />
      </label>

      <label className={labelCls}>
        <span>Description</span>
        <input
          className={inputCls}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional details"
          type="text"
          value={description}
        />
      </label>

      <label className={labelCls}>
        <span>Status</span>
        <select className={inputCls} onChange={(event) => setStatus(event.target.value as TaskWorkflowStatus)} value={status}>
          {TASK_WORKFLOW_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        <span>Project</span>
        <select
          className={inputCls}
          onChange={(event) => {
            setProjectId(event.target.value);
            setEpicId('');
          }}
          value={projectId}
        >
          <option value="">No project</option>
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {project.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelCls}>
        <span>Epic</span>
        <select className={inputCls} disabled={!projectId} onChange={(event) => setEpicId(event.target.value)} value={epicId}>
          <option value="">{projectId ? 'No epic' : 'Select a project first'}</option>
          {visibleEpics.map((epic) => (
            <option key={epic.id} value={epic.id}>
              {epic.name}
            </option>
          ))}
        </select>
      </label>

      <button
        className="bg-zinc-900 dark:bg-blue-600 text-white rounded-md px-4 py-2.5 text-[0.9rem] font-medium hover:bg-zinc-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Creating task...' : 'Create task'}
      </button>

      {errorMessage ? <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{errorMessage}</p> : null}
    </form>
  );
}

export default AddTaskForm;
