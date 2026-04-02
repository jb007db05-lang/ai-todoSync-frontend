import { FormEvent, useState } from 'react';

import type { Project } from '@/types/project';
import { TASK_WORKFLOW_STATUS_OPTIONS, type TaskWorkflowStatus } from '@/types/task';
import { flattenProjectOptions } from '@/utils/projectTree';

interface AddTaskFormProps {
  initialProjectId?: string | null;
  onCreateTask: (payload: {
    title: string;
    description?: string;
    note?: string;
    status?: TaskWorkflowStatus;
    projectId?: string | null;
    subtasks?: Array<{ title: string; note?: string; status?: TaskWorkflowStatus }>;
  }) => Promise<void>;
  projects: Project[];
}

function AddTaskForm({ initialProjectId = null, onCreateTask, projects }: AddTaskFormProps): JSX.Element {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [status, setStatus] = useState<TaskWorkflowStatus>('pending');
  const [projectId, setProjectId] = useState<string>(initialProjectId ?? '');
  const [subtaskDraft, setSubtaskDraft] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const projectOptions = flattenProjectOptions(projects);

  const parseSubtasks = (): Array<{ title: string; note?: string; status?: TaskWorkflowStatus }> =>
    subtaskDraft
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => parseSubtaskDraft(entry))
      .filter((subtask) => subtask.title !== '');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (title.trim() === '') {
      setErrorMessage('Task title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const subtasks = parseSubtasks();
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        note: note.trim() || undefined,
        status,
        projectId: projectId || undefined,
        subtasks: subtasks.length ? subtasks : undefined
      });
      setTitle('');
      setDescription('');
      setNote('');
      setStatus('pending');
      setProjectId(initialProjectId ?? '');
      setSubtaskDraft('');
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
        <span>Task note</span>
        <textarea
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional task-specific notes"
          rows={4}
          value={note}
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
        <select onChange={(event) => setProjectId(event.target.value)} value={projectId}>
          <option value="">No project</option>
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>
              {project.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Subtasks</span>
        <textarea
          onChange={(event) => setSubtaskDraft(event.target.value)}
          placeholder={'One subtask per line\nDraft endpoint :: in-progress :: API contract first\nReview schema :: completed'}
          rows={4}
          value={subtaskDraft}
        />
      </label>
      <button disabled={submitting} type="submit">
        {submitting ? 'Creating task...' : 'Create task'}
      </button>
      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </form>
  );
}

const parseSubtaskDraft = (entry: string): { title: string; note?: string; status?: TaskWorkflowStatus } => {
  const segments = entry
    .split('::')
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return { title: '' };
  }

  if (segments.length === 1) {
    return { title: segments[0] };
  }

  const maybeStatus = normalizeSubtaskStatusSegment(segments[segments.length - 1]);

  if (maybeStatus) {
    return {
      title: segments[0],
      note: segments.slice(1, -1).join(' :: ') || undefined,
      status: maybeStatus
    };
  }

  return {
    title: segments[0],
    note: segments.slice(1).join(' :: ') || undefined
  };
};

const normalizeSubtaskStatusSegment = (value: string): TaskWorkflowStatus | undefined => {
  const normalized = value.toLowerCase().replace('in-progress', 'in_progress').replace('in review', 'in_review');

  if (
    normalized === 'pending' ||
    normalized === 'in_progress' ||
    normalized === 'in_review' ||
    normalized === 'completed'
  ) {
    return normalized;
  }

  return undefined;
};

export default AddTaskForm;
