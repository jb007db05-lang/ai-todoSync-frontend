import { useState } from 'react';
import { Check, FilePenLine, NotebookPen, Plus, Rows3, Trash2 } from 'lucide-react';

import ActionGroup from '@/components/ActionGroup';
import EmptyState from '@/components/EmptyState';
import SourceBadge from '@/components/SourceBadge';
import type { Epic } from '@/types/epic';
import {
  TASK_WORKFLOW_STATUS_OPTIONS,
  type Subtask,
  type Task,
  type TaskWorkflowStatus
} from '@/types/task';

interface TaskCardProps {
  actionTaskId: string | null;
  availableEpics: Epic[];
  onCreateSubtask: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onDeleteSubtask: (task: Task, subtask: Subtask) => void;
  onEditTask?: (task: Task) => void;
  onEditSubtask?: (task: Task, subtask: Subtask) => void;
  onOpenSubtaskNote: (task: Task, subtask: Subtask) => void;
  onOpenTaskNote: (task: Task) => void;
  onUpdateEpic: (task: Task, epicId: string | null) => void;
  onUpdateStatus: (task: Task, status: TaskWorkflowStatus) => void;
  onUpdateSubtaskStatus: (task: Task, subtask: Subtask, status: TaskWorkflowStatus) => void;
  epicName?: string;
  projectName?: string;
  task: Task;
  onSelect?: (task: Task) => void;
  isSelected?: boolean;
}

const statusPillClasses: Record<string, string> = {
  pending:     'bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-900/30  dark:text-amber-300  dark:border-amber-800',
  in_progress: 'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-900/30   dark:text-blue-300   dark:border-blue-800',
  in_review:   'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  completed:   'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  done:        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  rolled_over: 'bg-zinc-100  text-zinc-600   border-zinc-200   dark:bg-slate-800      dark:text-slate-400  dark:border-slate-700',
};

const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-900 dark:text-slate-100 px-3 py-2.5 text-sm transition-all focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10';
const ghostBtn = 'inline-flex items-center gap-1.5 px-3 py-2 text-[0.8rem] font-medium bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors';
const completeBtn = 'inline-flex items-center gap-1.5 px-3 py-2 text-[0.8rem] font-medium bg-teal-50/10 dark:bg-teal-900/20 border border-teal-600/18 dark:border-teal-700 rounded text-teal-700 dark:text-teal-300 hover:bg-teal-50/16 disabled:opacity-50 transition-colors';
const dangerBtn = 'inline-flex items-center gap-1.5 px-3 py-2 text-[0.8rem] font-medium bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors';

function TaskCard({
  actionTaskId,
  availableEpics,
  onCreateSubtask,
  onDelete,
  onDeleteSubtask,
  onEditTask,
  onEditSubtask,
  onOpenSubtaskNote,
  onOpenTaskNote,
  onUpdateEpic,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  epicName,
  projectName,
  task,
  onSelect,
  isSelected
}: TaskCardProps): JSX.Element {
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
  const [expanded, setExpanded] = useState(false);

  const statusCls = statusPillClasses[task.status] ?? statusPillClasses.pending;

  return (
    <article
      className={[
        'bg-gradient-to-b from-white/99 to-slate-50/98 dark:from-slate-800/99 dark:to-slate-800/98',
        'border border-zinc-200/80 dark:border-slate-700 rounded-[10px]',
        'shadow-[0_14px_24px_rgba(15,23,42,0.05)] dark:shadow-[0_14px_24px_rgba(2,8,23,0.3)]',
        'grid gap-4 p-6 relative overflow-hidden transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-[0_18px_28px_rgba(15,23,42,0.06)]',
        isSelected ? 'ring-2 ring-blue-500/40 dark:ring-blue-400/40' : ''
      ].join(' ')}
    >
      {/* Top action bar */}


      {/* Accordion trigger */}
      <button
        className="flex justify-between items-start gap-3 text-left bg-transparent"
        onClick={() => {
          if (onSelect) {
            onSelect(task);
          } else {
            setExpanded((current) => !current);
          }
        }}
        type="button"
      >
        {/* Task heading */}
        <div className="grid gap-1.5">
          <h3 className="text-[1.3rem] font-semibold tracking-[-0.03em] text-zinc-900 dark:text-slate-100 m-0">{task.title}</h3>
          <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">{task.description || 'No description provided.'}</p>
          {projectName ? <p className="text-teal-600 dark:text-teal-400 text-[0.9rem] m-0">Project: {projectName}</p> : null}
          {epicName ? <p className="text-teal-600 dark:text-teal-400 text-[0.9rem] m-0">Epic: {epicName}</p> : null}
        </div>

        {/* Meta */}
        {/* <div className="grid gap-1.5 justify-items-end shrink-0">
          <span className={`inline-block border rounded text-[0.72rem] font-semibold px-2 py-0.5 capitalize whitespace-nowrap ${statusCls}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className="text-zinc-400 dark:text-slate-500 text-[0.85rem] font-semibold">
            {completedSubtasks}/{task.subtasks.length} subtasks
          </span>
        </div> */}
      </button>

      {/* Expanded content */}
      {expanded ? (
        <div className="grid gap-4">
          {/* Task meta */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 border border-zinc-200/60 dark:border-slate-700 rounded-2xl px-3.5 py-3">
            <SourceBadge source={task.source} />
            <span className="bg-white/72 dark:bg-slate-700 border border-zinc-200/60 dark:border-slate-600 rounded px-3 py-2 text-zinc-500 dark:text-slate-400 text-[0.92rem]">
              Rollover count: {task.rolloverCount}
            </span>
          </div>

          {/* Status editor */}
          <label className="grid gap-2 bg-slate-50/90 dark:bg-slate-800/90 border border-zinc-200/60 dark:border-slate-700 rounded-2xl p-3.5 max-w-[260px]">
            <span className="text-zinc-500 dark:text-slate-400 text-[0.86rem] font-semibold">Task status</span>
            <select
              className={inputCls}
              disabled={actionTaskId === task.id || task.status === 'rolled_over'}
              onChange={(event) => onUpdateStatus(task, event.target.value as TaskWorkflowStatus)}
              value={task.status === 'rolled_over' ? 'completed' : task.status}
            >
              {TASK_WORKFLOW_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          {/* Epic editor */}
          <label className="grid gap-2 bg-slate-50/90 dark:bg-slate-800/90 border border-zinc-200/60 dark:border-slate-700 rounded-2xl p-3.5 max-w-[260px]">
            <span className="text-zinc-500 dark:text-slate-400 text-[0.86rem] font-semibold">Epic</span>
            <select
              className={inputCls}
              disabled={actionTaskId === task.id || !task.projectId}
              onChange={(event) => onUpdateEpic(task, event.target.value || null)}
              value={task.epicId ?? ''}
            >
              <option value="">{task.projectId ? 'No epic' : 'No project assigned'}</option>
              {availableEpics.map((epic) => (
                <option key={epic.id} value={epic.id}>{epic.name}</option>
              ))}
            </select>
          </label>

          <ActionGroup>
            <button
              className={completeBtn}
              disabled={actionTaskId === task.id || task.status === 'completed' || task.status === 'rolled_over'}
              onClick={() => onUpdateStatus(task, 'completed')}
              type="button"
            >
              <Check size={16} />
              {task.status === 'completed' ? 'Task Completed' : 'Mark Task as Completed'}
            </button>
            <button
              className={ghostBtn}
              disabled={actionTaskId === task.id}
              onClick={() => onOpenTaskNote(task)}
              type="button"
            >
              <FilePenLine size={16} />
              {task.note?.trim() ? 'View Task Note' : 'Add Task Note'}
            </button>
          </ActionGroup>

          {/* Subtasks section */}
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-slate-400 text-[0.86rem] font-semibold">Sub-tasks</span>
            <button
              aria-label={`Create sub-task for ${task.title}`}
              className="flex items-center justify-center w-9 h-9 bg-blue-600 dark:bg-blue-500 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-400 disabled:opacity-50 transition-colors"
              disabled={actionTaskId === task.id}
              onClick={() => onCreateSubtask(task)}
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>

          {task.subtasks.length ? (
            <div className="bg-gradient-to-b from-slate-50/96 to-slate-100/98 dark:from-slate-800/96 dark:to-slate-900/98 border border-zinc-200/60 dark:border-slate-700 rounded-[18px] grid gap-2.5 p-4">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id || subtask.title}
                  className="bg-white/80 dark:bg-slate-800/80 border border-zinc-200/50 dark:border-slate-700 rounded-2xl p-3.5 grid grid-cols-[1fr_auto] gap-3 items-center"
                >
                  <label className="flex items-center gap-3 justify-between min-w-0">
                    <span className={subtask.completed ? 'text-zinc-400 dark:text-slate-500 line-through' : 'text-zinc-800 dark:text-slate-200'}>
                      {subtask.title}
                    </span>
                    <select
                      className={inputCls + ' max-w-[160px]'}
                      disabled={actionTaskId === task.id}
                      onChange={(event) =>
                        onUpdateSubtaskStatus(task, subtask, event.target.value as TaskWorkflowStatus)
                      }
                      value={subtask.status}
                    >
                      {TASK_WORKFLOW_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <div className="flex gap-2.5 justify-end flex-wrap">
                    <button
                      className={completeBtn}
                      disabled={actionTaskId === task.id || subtask.status === 'completed'}
                      onClick={() => onUpdateSubtaskStatus(task, subtask, 'completed')}
                      type="button"
                    >
                      <Check size={16} />
                      {subtask.status === 'completed' ? 'Completed' : 'Mark as Completed'}
                    </button>
                    {onEditSubtask && (
                      <button
                        className={ghostBtn}
                        disabled={actionTaskId === task.id}
                        onClick={() => onEditSubtask(task, subtask)}
                        type="button"
                      >
                        <FilePenLine size={16} /> Edit
                      </button>
                    )}
                    <button
                      className={ghostBtn}
                      disabled={actionTaskId === task.id}
                      onClick={() => onOpenSubtaskNote(task, subtask)}
                      type="button"
                    >
                      <NotebookPen size={16} />
                      {subtask.note?.trim() ? 'View Sub-task Note' : 'Add Sub-task Note'}
                    </button>
                    <button
                      className={dangerBtn}
                      disabled={actionTaskId === task.id}
                      onClick={() => onDeleteSubtask(task, subtask)}
                      type="button"
                    >
                      <Trash2 size={16} /> Delete Sub-task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              compact
              description="Use the plus button to create one or more sub-tasks for this task."
              icon={Rows3}
              title="No sub-tasks yet"
            />
          )}

          <ActionGroup>
            <button
              className={dangerBtn}
              disabled={actionTaskId === task.id}
              onClick={() => onDelete(task.id)}
              type="button"
            >
              <Trash2 size={16} />
              {actionTaskId === task.id ? 'Deleting...' : 'Delete Task'}
            </button>
          </ActionGroup>
        </div>
      ) : null}

            <div className="flex justify-end gap-2 -mb-1">
        {onEditTask && (
          <button
            aria-label={`Edit ${task.title}`}
            className="flex items-center justify-center w-9 h-9 p-2 bg-white/60 dark:bg-slate-800/60 border border-zinc-200 dark:border-slate-600 rounded text-zinc-500 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 transition-colors backdrop-blur-sm"
            disabled={actionTaskId === task.id}
            onClick={(event) => {
              event.stopPropagation();
              onEditTask(task);
            }}
            type="button"
          >
            <FilePenLine size={15} />
          </button>
        )}
        <button
          aria-label={`Delete ${task.title}`}
          className="flex items-center justify-center w-9 h-9 p-2 bg-white/60 dark:bg-slate-800/60 border border-red-200 dark:border-red-800/50 rounded text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors backdrop-blur-sm"
          disabled={actionTaskId === task.id}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(task.id);
          }}
          type="button"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </article>
  );
}

export default TaskCard;
