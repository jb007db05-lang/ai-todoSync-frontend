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
        <span>Project</span>
        <select
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
      <label>
        <span>Epic</span>
        <select disabled={!projectId} onChange={(event) => setEpicId(event.target.value)} value={epicId}>
          <option value="">{projectId ? 'No epic' : 'Select a project first'}</option>
          {visibleEpics.map((epic) => (
            <option key={epic.id} value={epic.id}>
              {epic.name}
            </option>
          ))}
        </select>
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? 'Creating task...' : 'Create task'}
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </form>
  );
}

export default AddTaskForm;
