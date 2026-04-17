import { AlertCircle, FilePenLine, Rows3, Trash2, ArrowUpCircle, ArrowDownCircle, MinusCircle, MessageSquare } from 'lucide-react';

import type { Epic } from '@/types/epic';
import type { Project } from '@/types/project';
import {
  type Subtask,
  type Task,
  type TaskWorkflowStatus,
  type TaskPriority
} from '@/types/task';
import UserAvatar from './UserAvatar';

interface TaskCardProps {
  actionTaskId?: string | null;
  availableEpics?: Epic[];
  onCreateSubtask?: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDeleteSubtask?: (task: Task, subtask: Subtask) => void;
  onEditTask?: (task: Task) => void;
  onEditSubtask?: (task: Task, subtask: Subtask) => void;
  onOpenEpicNotes?: (epic: Epic) => void;
  onOpenProjectNotes?: (project: Project) => void;
  onOpenSubtaskNote?: (task: Task, subtask: Subtask) => void;
  onOpenTaskNote?: (task: Task) => void;
  onUpdateEpic?: (task: Task, epicId: string | null) => void;
  onUpdateStatus?: (task: Task, status: TaskWorkflowStatus) => void;
  onUpdateSubtaskStatus?: (task: Task, subtask: Subtask, status: TaskWorkflowStatus) => void;
  epicName?: string;
  projectName?: string;
  task: Task;
  onSelect?: (task: Task) => void;
  onComment?: (task: Task) => void;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  onToggleSelection?: (taskId: string) => void;
}

const statusPillClasses: Record<string, string> = {
  BACKLOG: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  TODO: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/30',
  IN_PROGRESS: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-500/30',
  IN_REVIEW: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-500/30',
  BLOCKED: 'bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300 border-red-100 dark:border-red-500/30',
  DONE: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/30',
  rolled_over: 'bg-zinc-50 dark:bg-slate-800 text-zinc-500 dark:text-slate-500 border-zinc-100 dark:border-slate-800',
};

const priorityIcons: Record<TaskPriority, JSX.Element> = {
  HIGH: <ArrowUpCircle size={12} className="text-red-500" />,
  MEDIUM: <MinusCircle size={12} className="text-amber-500" />,
  LOW: <ArrowDownCircle size={12} className="text-slate-400" />,
};

function TaskCard({
  actionTaskId,
  onDelete,
  onEditTask,
  epicName,
  projectName,
  task,
  onSelect,
  onComment,
  isSelected,
  isMultiSelected,
  onToggleSelection
}: TaskCardProps): JSX.Element {
  const completedSubtasksCount = task.subtasks.filter((subtask) => subtask.status === 'DONE').length;
  const statusCls = statusPillClasses[task.status] || statusPillClasses.TODO;
  const isUpdating = actionTaskId === task.id;

  return (
    <article
      className={[
        'group relative flex flex-col gap-4 p-4 transition-all duration-300',
        'bg-white dark:bg-slate-900',
        'border rounded-xl font-["Inter"] shadow-sm',
        isSelected
          ? 'border-blue-400/70 dark:border-blue-400/60 shadow-sm bg-blue-50/60 dark:bg-blue-500/8'
          : 'border-zinc-200/80 dark:border-slate-700/80 hover:border-zinc-300 dark:hover:border-slate-600 hover:-translate-y-[2px]',
        isUpdating ? 'opacity-60 grayscale-[0.5] cursor-wait' : 'cursor-pointer'
      ].join(' ')}
      onClick={() => !isUpdating && onSelect?.(task)}
    >
      {isUpdating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/10 dark:bg-slate-900/10 backdrop-blur-[1px] rounded-xl overflow-hidden">
          <div className="flex gap-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.3s]" />
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.15s]" />
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
          </div>
        </div>
      )}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {onToggleSelection && (
                <input
                  type="checkbox"
                  checked={isMultiSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelection(task.id);
                  }}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              )}
              <div className={`px-2 py-0.5 rounded-full text-[0.6rem] font-black uppercase tracking-wider border shadow-sm ${statusCls}`}>
                {task.status.replace('_', ' ')}
              </div>
              {task.priority && (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {priorityIcons[task.priority]}
                  <span className="text-[0.6rem] font-bold text-slate-500 dark:text-slate-400">{task.priority}</span>
                </div>
              )}
            </div>

            {task.isBlocked && (
              <div className="flex items-center gap-1 text-red-500" title={task.blockedByTaskId ? `Blocked by task ${task.blockedByTaskId}` : 'Blocked'}>
                <AlertCircle size={14} />
              </div>
            )}
          </div>

          <h3 className="text-[0.95rem] font-bold tracking-tight text-slate-900 dark:text-slate-100 m-0 leading-snug line-clamp-2">
            {task.title}
          </h3>

          <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-[0.75rem] leading-relaxed line-clamp-2 font-medium">
            {task.description || 'No description provided.'}
          </p>

          {(projectName || epicName || task.subtasks.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-100/90 dark:border-slate-700/50 text-slate-400 dark:text-slate-400">
              {task.subtasks.length > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/90">
                  <Rows3 size={10} />
                  <span className="text-[0.65rem] font-bold">
                    {completedSubtasksCount}<span className="opacity-40">/</span>{task.subtasks.length}
                  </span>
                </div>
              )}
              {projectName && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/90">
                  <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider truncate max-w-[100px]">{projectName}</span>
                </div>
              )}
              {epicName && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800/90">
                  <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider truncate max-w-[100px]">{epicName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3">
          <UserAvatar 
            name={task.assignedTo?.name} 
            email={task.assignedTo?.email} 
            size="sm" 
            className="ring-2 ring-white dark:ring-slate-900 shadow-md"
          />
          <div className="flex flex-col gap-1">
            {onEditTask && (
              <button
                className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-zinc-200/80 dark:border-slate-700 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-40 shadow-sm"
                disabled={!task.permissions.canEdit}
                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                title="Edit Task"
              >
                <FilePenLine size={13} />
              </button>
            )}
            <button
              className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-zinc-200/80 dark:border-slate-700 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
              onClick={(e) => { e.stopPropagation(); onComment?.(task); }}
              title="Add Comment"
            >
              <MessageSquare size={13} />
            </button>
            <button
              className="p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 border border-zinc-200/80 dark:border-slate-700 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40 shadow-sm"
              disabled={!task.permissions.canDelete}
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              title="Delete Task"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default TaskCard;
