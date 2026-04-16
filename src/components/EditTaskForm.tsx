import { FormEvent, useMemo, useState } from 'react';

import type { Epic } from '@/types/epic';
import type { Project, ProjectMember } from '@/types/project';
import { TASK_WORKFLOW_STATUS_OPTIONS, type Task, type TaskWorkflowStatus } from '@/types/task';

interface EditTaskFormProps {
  epics: Epic[];
  onSubmit: (payload: {
    title: string;
    description?: string;
    date: string;
    status: TaskWorkflowStatus;
    projectId: string | null;
    epicId: string | null;
    assignedToUserId: string | null;
  }) => Promise<void>;
  projectMembersByProject: Record<string, ProjectMember[]>;
  projects: Project[];
  task: Task;
}

const inputCls =
  'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md ' +
  'text-olive-950 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none ' +
  'focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10';
const labelCls = 'grid gap-2 font-medium text-[0.95rem] text-olive-950 dark:text-slate-100';

function EditTaskForm({ epics, onSubmit, projectMembersByProject, projects, task }: EditTaskFormProps): JSX.Element {
  const initialStatus: TaskWorkflowStatus =
    task.status === 'rolled_over' ? 'pending' : (task.status as TaskWorkflowStatus);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [date, setDate] = useState(task.date);
  const [status, setStatus] = useState<TaskWorkflowStatus>(initialStatus);
  const [projectId, setProjectId] = useState<string>(task.projectId ?? '');
  const [epicId, setEpicId] = useState<string>(task.epicId ?? '');
  const [assignedToUserId, setAssignedToUserId] = useState<string>(task.assignedToUserId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentProject = useMemo(
    () => projects.find((project) => project.id === projectId) ?? null,
    [projectId, projects]
  );
  const canChangeProject = currentProject == null || currentProject.currentUserRole === 'ADMIN';
  const selectableProjects = useMemo(
    () => projects.filter((project) => project.currentUserRole === 'ADMIN' || project.id === task.projectId),
    [projects, task.projectId]
  );

  const handleProjectChange = (newProjectId: string): void => {
    setProjectId(newProjectId);
    const currentEpic = epics.find((epic) => epic.id === epicId);

    if (currentEpic && currentEpic.projectId !== newProjectId) {
      setEpicId('');
    }

    if (newProjectId === '') {
      setAssignedToUserId('');
      return;
    }

    const nextMembers = projectMembersByProject[newProjectId] ?? [];
    if (!nextMembers.some((member) => member.userId === assignedToUserId)) {
      setAssignedToUserId('');
    }
  };

  const availableEpics = projectId
    ? epics.filter((epic) => epic.projectId === projectId)
    : [];
  const availableMembers = projectId ? (projectMembersByProject[projectId] ?? []) : [];

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
        assignedToUserId: assignedToUserId || null,
      });
    } catch {
      setErrorMessage('Unable to save the task right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-[18px] mt-2" onSubmit={(event) => void handleSubmit(event)}>
      <label className={labelCls}>
        <span>Title</span>
        <input
          autoFocus
          className={inputCls}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Task title"
          type="text"
          value={title}
        />
      </label>

      <label className={labelCls}>
        <span>Description <span className="text-zinc-400 dark:text-slate-500 font-normal text-[0.82rem]">(optional)</span></span>
        <textarea
          className={`${inputCls} min-h-[88px] resize-y`}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Optional context or details"
          rows={3}
          value={description}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className={labelCls}>
          <span>Date</span>
          <input
            className={inputCls}
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
        </label>

        <label className={labelCls}>
          <span>Status</span>
          <select
            className={inputCls}
            onChange={(event) => setStatus(event.target.value as TaskWorkflowStatus)}
            value={status}
          >
            {TASK_WORKFLOW_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelCls}>
        <span>Project <span className="text-zinc-400 dark:text-slate-500 font-normal text-[0.82rem]">(optional)</span></span>
        <select
          className={inputCls}
          disabled={!canChangeProject}
          onChange={(event) => handleProjectChange(event.target.value)}
          value={projectId}
        >
          <option value="">No project</option>
          {selectableProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      {projectId && (
        <label className={labelCls}>
          <span>Epic <span className="text-zinc-400 dark:text-slate-500 font-normal text-[0.82rem]">(optional)</span></span>
          <select
            className={inputCls}
            onChange={(event) => setEpicId(event.target.value)}
            value={epicId}
          >
            <option value="">No epic</option>
            {availableEpics.map((epic) => (
              <option key={epic.id} value={epic.id}>
                {epic.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {projectId && (
        <label className={labelCls}>
          <span>Assignee <span className="text-zinc-400 dark:text-slate-500 font-normal text-[0.82rem]">(optional)</span></span>
          <select
            className={inputCls}
            disabled={!task.permissions.canAssign}
            onChange={(event) => setAssignedToUserId(event.target.value)}
            value={assignedToUserId}
          >
            <option value="">Unassigned</option>
            {availableMembers.map((member) => (
              <option key={member.id} value={member.userId}>
                {member.user.name ? `${member.user.name} (${member.user.email})` : member.user.email}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        className="bg-olive-900 dark:bg-blue-600 text-white rounded-md px-4 py-2.5 text-[0.9rem] font-medium hover:bg-olive-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors"
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
