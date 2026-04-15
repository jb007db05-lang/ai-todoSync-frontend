import { FilePenLine, Rows3, Trash2 } from 'lucide-react';

import type { Epic } from '@/types/epic';
import type { Project } from '@/types/project';
import {
  type Subtask,
  type Task,
  type TaskWorkflowStatus
} from '@/types/task';

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
  isSelected?: boolean;
}

const statusPillClasses: Record<string, string> = {
  pending: 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-100 dark:border-amber-500/30',
  in_progress: 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-500/30',
  in_review: 'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-500/30',
  completed: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/30',
  done: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/30',
  rolled_over: 'bg-zinc-50 dark:bg-slate-800 text-zinc-500 dark:text-slate-500 border-zinc-100 dark:border-slate-800',
};

function TaskCard({
  onDelete,
  onEditTask,
  epicName,
  projectName,
  task,
  onSelect,
  isSelected
}: TaskCardProps): JSX.Element {
  const completedSubtasksCount = task.subtasks.filter((subtask) => subtask.status === 'completed').length;
  const statusCls = statusPillClasses[task.status] ?? statusPillClasses.pending;

  return (
    <article
      className={[
        'group relative flex flex-col gap-5 p-6 cursor-pointer transition-all duration-300',
        'bg-white dark:bg-slate-800/40',
        'border rounded-xl font-["Inter"]',
        isSelected
          ? 'border-blue-500/50 dark:border-blue-400/50 shadow-sm bg-blue-50/10 dark:bg-blue-500/5'
          : 'border-zinc-200 dark:border-slate-800 hover:border-zinc-300 dark:hover:border-slate-700 hover:bg-zinc-50 dark:hover:bg-slate-800/60'
      ].join(' ')}
      onClick={() => onSelect?.(task)}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={`px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-wider border shadow-sm ${statusCls}`}>
              {task.status.replace('_', ' ')}
            </div>
          </div>
          
          <h3 className="text-[1.1rem] font-bold tracking-tight text-zinc-900 dark:text-slate-100 m-0 leading-snug line-clamp-2">
            {task.title}
          </h3>

          <p className="mt-2 text-zinc-500 dark:text-slate-400 text-[0.85rem] leading-relaxed line-clamp-2 font-medium">
            {task.description || 'No description provided.'}
          </p>

          {(projectName || epicName || task.subtasks.length > 0) && (
            <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-zinc-100 dark:border-slate-800/50 text-zinc-400 dark:text-slate-400">
              {task.subtasks.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Rows3 size={12} />
                  <span className="text-[0.7rem] font-bold tracking-tighter">
                    {completedSubtasksCount}<span className="opacity-40">/</span>{task.subtasks.length}
                  </span>
                </div>
              )}
              {projectName && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest truncate max-w-[120px]">{projectName}</span>
                </div>
              )}
              {epicName && (
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-indigo-500/50" />
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest truncate max-w-[120px]">{epicName}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Toolbar — Always Visible */}
        <div className="flex flex-col gap-1.5">
          {onEditTask && (
            <button
              className="p-2 rounded-md bg-zinc-50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
              title="Edit Task"
            >
              <FilePenLine size={14} />
            </button>
          )}
          <button
            className="p-2 rounded-md bg-zinc-50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 text-zinc-400 hover:text-red-500 transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            title="Delete Task"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default TaskCard;
