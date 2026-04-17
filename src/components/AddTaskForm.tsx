import { FormEvent, useState, useEffect } from 'react';

import type { Epic } from '@/types/epic';
import type { Project } from '@/types/project';
import { TASK_WORKFLOW_STATUS_OPTIONS, type TaskWorkflowStatus, type TaskPriority } from '@/types/task';
import { flattenProjectOptions } from '@/utils/projectTree';
import AssigneeSelector from './AssigneeSelector';
import { useAuth } from '@/context/AuthContext';
import { AlertTriangle } from 'lucide-react';

interface AddTaskFormProps {
  epics: Epic[];
  initialProjectId?: string | null;
  initialEpicId?: string | null;
  onCreateTask: (payload: {
    title: string;
    description?: string;
    note?: string;
    status?: TaskWorkflowStatus;
    priority?: TaskPriority;
    projectId?: string | null;
    epicId?: string | null;
    assignedTo?: string;
  }) => Promise<void>;
  projects: Project[];
}

const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-olive-950 dark:text-slate-100 px-4 py-3.5 transition-all duration-200 focus:outline-none focus:border-olive-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-olive-500/10';
const labelCls = 'grid gap-2 font-medium text-[0.95rem] text-olive-950 dark:text-slate-100';

function AddTaskForm({ epics, initialProjectId = null, initialEpicId = null, onCreateTask, projects }: AddTaskFormProps): JSX.Element {
  const { user } = useAuth();
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [status, setStatus] = useState<TaskWorkflowStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [projectId, setProjectId] = useState<string>(initialProjectId ?? '');
  const [epicId, setEpicId] = useState<string>(initialEpicId ?? '');
  const [assignedTo, setAssignedTo] = useState<string>(user?.id ?? '');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id && !assignedTo) {
      setAssignedTo(user.id);
    }
  }, [user?.id, assignedTo]);

  useEffect(() => {
    if (initialProjectId) {
      setProjectId(initialProjectId);
    }
  }, [initialProjectId]);

  useEffect(() => {
    if (initialEpicId) {
      setEpicId(initialEpicId);
      // If we have an epic but no project ID, try to find the project ID from epics list
      if (!projectId) {
        const parentEpic = epics.find(e => e.id === initialEpicId);
        if (parentEpic) {
          setProjectId(parentEpic.projectId);
        }
      }
    }
  }, [initialEpicId, epics, projectId]);

  const projectOptions = flattenProjectOptions(projects);
  const visibleEpics = epics.filter((epic) => epic.projectId === (projectId || initialProjectId)).sort((left, right) => left.order - right.order);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (title.trim() === '') {
      setErrorMessage('Task title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const finalProjectId = projectId || initialProjectId || null;
    const finalEpicId = epicId || initialEpicId || null;

    console.log('[DEBUG] AddTaskForm submitting:', { 
      projectId, initialProjectId, finalProjectId, 
      epicId, initialEpicId, finalEpicId 
    });

    try {
      await onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        note: note.trim() || undefined,
        status,
        priority,
        projectId: finalProjectId,
        epicId: finalEpicId || null,
        assignedTo: assignedTo || undefined
      });
      setTitle('');
      setDescription('');
      setNote('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setProjectId(initialProjectId ?? '');
      setEpicId(initialEpicId ?? '');
    } catch {
      setErrorMessage('Unable to create the task right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="grid gap-[18px] mt-2" onSubmit={(event) => void handleSubmit(event)}>
      <label className={labelCls}>
        <span>Task title</span>
        <input
          autoFocus
          className={inputCls}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="What needs to be done?"
          required
          type="text"
          value={title}
        />
      </label>

      <label className={labelCls}>
        <span>Description <span className="text-zinc-400 dark:text-slate-500 font-normal text-[0.82rem]">(optional)</span></span>
        <textarea
          className={`${inputCls} min-h-[80px] resize-y`}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add more details about this task"
          rows={2}
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
          <span>Initial Status</span>
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

      <div className="grid gap-1.5">
        <AssigneeSelector
          projectId={projectId || initialProjectId || null}
          selectedUserId={assignedTo}
          onSelect={setAssignedTo}
          label="Assigned to"
        />
      </div>

      {!initialProjectId && (
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
      )}

      {(!initialEpicId && (projectId || initialProjectId)) && (
        <label className={labelCls}>
          <span>Epic</span>
          <select className={inputCls} onChange={(event) => setEpicId(event.target.value)} value={epicId}>
            <option value="">No epic</option>
            {visibleEpics.map((epic) => (
              <option key={epic.id} value={epic.id}>
                {epic.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        className="bg-slate-900 dark:bg-blue-600 text-white rounded-md px-4 py-3 text-[0.95rem] font-bold hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
        disabled={submitting}
        type="submit"
      >
        {submitting ? 'Creating task...' : 'Create Task'}
      </button>

      {errorMessage ? (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
          <AlertTriangle size={14} className="text-red-500" />
          <p className="text-red-600 dark:text-red-400 m-0 text-[0.85rem] font-medium">{errorMessage}</p>
        </div>
      ) : null}
    </form>
  );
}

export default AddTaskForm;
