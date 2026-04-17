import { FormEvent, useMemo, useState } from 'react';

import type { Epic } from '@/types/epic';
import type { Project } from '@/types/project';
import { TASK_WORKFLOW_STATUS_OPTIONS, type Task, type TaskWorkflowStatus, type TaskPriority } from '@/types/task';
import AssigneeSelector from './AssigneeSelector';
import { AlertCircle } from 'lucide-react';

interface EditTaskFormProps {
  epics: Epic[];
  allTasks: Task[];
  onSubmit: (payload: {
    title: string;
    description?: string;
    note?: string;
    date: string;
    status: TaskWorkflowStatus;
    priority: TaskPriority;
    isBlocked: boolean;
    blockedByTaskId: string | null;
    projectId: string | null;
    epicId: string | null;
    assignedTo: string;
  }) => Promise<void>;
  projects: Project[];
  task: Task;
}

const inputCls =
  'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md ' +
  'text-olive-950 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none ' +
  'focus:border-olive-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-olive-500/10';
const labelCls = 'grid gap-2 font-medium text-[0.95rem] text-olive-950 dark:text-slate-100';

function EditTaskForm({ epics, allTasks, onSubmit, projects, task }: EditTaskFormProps): JSX.Element {
  const initialStatus: TaskWorkflowStatus =
    task.status === 'rolled_over' ? 'TODO' : (task.status as TaskWorkflowStatus);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [note] = useState(task.note ?? '');
  const [date, setDate] = useState(task.date);
  const [status, setStatus] = useState<TaskWorkflowStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>(task.priority || 'MEDIUM');
  const [isBlocked, setIsBlocked] = useState(task.isBlocked || false);
  const [blockedByTaskId, setBlockedByTaskId] = useState<string>(task.blockedByTaskId || '');
  const [projectId, setProjectId] = useState<string>(task.projectId ?? '');
  const [epicId, setEpicId] = useState<string>(task.epicId ?? '');
  const [assignedTo, setAssignedTo] = useState<string>(task.assignedTo?.id || '');
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
  };

  const availableEpics = projectId
    ? epics.filter((epic) => epic.projectId === projectId)
    : [];

  const otherTasks = useMemo(() => {
    return allTasks.filter(t => t.id !== task.id && (projectId ? t.projectId === projectId : true));
  }, [allTasks, task.id, projectId]);

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
        note: note.trim() || undefined,
        date,
        status,
        priority,
        isBlocked,
        blockedByTaskId: isBlocked ? (blockedByTaskId || null) : null,
        projectId: projectId || null,
        epicId: epicId || null,
        assignedTo,
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
          <span>Priority</span>
          <select
            className={inputCls}
            onChange={(event) => setPriority(event.target.value as TaskPriority)}
            value={priority}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
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

      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isBlocked} 
              onChange={(e) => setIsBlocked(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <AlertCircle size={14} className="text-red-500" />
              Mark as Blocked
            </span>
          </label>
        </div>
        
        {isBlocked && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className={labelCls}>
              <span className="text-xs uppercase tracking-wider text-slate-400">Blocked by Task</span>
              <select
                className={inputCls}
                onChange={(event) => setBlockedByTaskId(event.target.value)}
                value={blockedByTaskId}
              >
                <option value="">Select a task...</option>
                {otherTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

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
        
        <div className="grid gap-1.5">
          <AssigneeSelector
            projectId={projectId || null}
            selectedUserId={assignedTo}
            onSelect={setAssignedTo}
            label="Assigned to"
            disabled={!task.permissions.canAssign && !task.permissions.canReassign}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
      </div>

      <button
        className="bg-slate-900 dark:bg-blue-600 text-white rounded-md px-4 py-3 text-[0.95rem] font-bold hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Saving task...' : 'Update Task'}
      </button>

      {errorMessage ? (
        <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem] font-medium">{errorMessage}</p>
      ) : null}
    </form>
  );
}

export default EditTaskForm;
