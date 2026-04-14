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

function TaskCard({
  actionTaskId,
  availableEpics,
  onCreateSubtask,
  onDelete,
  onDeleteSubtask,
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

  return (
    <article className={`task-card accordion-card ${expanded ? 'accordion-open' : ''} ${isSelected ? 'project-nav-item-active' : ''}`}>
      <div className="task-card-topbar">
        <button
          aria-label={`Delete ${task.title}`}
          className="danger-button ghost-button task-card-delete-button"
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
      <button
        className="accordion-trigger"
        onClick={() => {
          if (onSelect) {
            onSelect(task);
          } else {
            setExpanded((current) => !current);
          }
        }}
        type="button"
      >
        <div className="task-heading">
          <h3>{task.title}</h3>
          <p className="muted-text">{task.description || 'No description provided.'}</p>
          {projectName ? <p className="task-project-label">Project: {projectName}</p> : null}
          {epicName ? <p className="task-project-label">Epic: {epicName}</p> : null}
        </div>
        <div className="accordion-summary-meta">
          <span className={`status-pill status-${task.status}`}>{task.status.replace('_', ' ')}</span>
          <span className="accordion-count">{completedSubtasks}/{task.subtasks.length} subtasks</span>
        </div>
      </button>
      {expanded ? (
        <div className="accordion-content">
          <div className="task-meta">
            <SourceBadge source={task.source} />
            <span>Rollover count: {task.rolloverCount}</span>
          </div>
          <label className="status-editor">
            <span>Task status</span>
            <select
              disabled={actionTaskId === task.id || task.status === 'rolled_over'}
              onChange={(event) => onUpdateStatus(task, event.target.value as TaskWorkflowStatus)}
              value={task.status === 'rolled_over' ? 'completed' : task.status}
            >
              {TASK_WORKFLOW_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="status-editor">
            <span>Epic</span>
            <select
              disabled={actionTaskId === task.id || !task.projectId}
              onChange={(event) => onUpdateEpic(task, event.target.value || null)}
              value={task.epicId ?? ''}
            >
              <option value="">{task.projectId ? 'No epic' : 'No project assigned'}</option>
              {availableEpics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  {epic.name}
                </option>
              ))}
            </select>
          </label>
          <ActionGroup>
            <button
              className="secondary-button complete-button"
              disabled={actionTaskId === task.id || task.status === 'completed' || task.status === 'rolled_over'}
              onClick={() => onUpdateStatus(task, 'completed')}
              type="button"
            >
              <Check size={16} />
              {task.status === 'completed' ? 'Task Completed' : 'Mark Task as Completed'}
            </button>
            <button
              className="secondary-button"
              disabled={actionTaskId === task.id}
              onClick={() => onOpenTaskNote(task)}
              type="button"
            >
              <FilePenLine size={16} />
              {task.note?.trim() ? 'View Task Note' : 'Add Task Note'}
            </button>
          </ActionGroup>
          <div className="subtask-section-header">
            <span className="subtask-section-title">Sub-tasks</span>
            <button
              aria-label={`Create sub-task for ${task.title}`}
              className="secondary-button subtask-add-button"
              disabled={actionTaskId === task.id}
              onClick={() => onCreateSubtask(task)}
              type="button"
            >
              <Plus size={18} />
            </button>
          </div>
          {task.subtasks.length ? (
            <div className="subtask-list">
              {task.subtasks.map((subtask) => (
                <div className="subtask-row" key={subtask.id || subtask.title}>
                  <label>
                    <span className={subtask.completed ? 'subtask-title subtask-title-done' : 'subtask-title'}>
                      {subtask.title}
                    </span>
                    <select
                      disabled={actionTaskId === task.id}
                      onChange={(event) =>
                        onUpdateSubtaskStatus(task, subtask, event.target.value as TaskWorkflowStatus)
                      }
                      value={subtask.status}
                    >
                      {TASK_WORKFLOW_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="subtask-row-actions">
                    <button
                      className="secondary-button complete-button"
                      disabled={actionTaskId === task.id || subtask.status === 'completed'}
                      onClick={() => onUpdateSubtaskStatus(task, subtask, 'completed')}
                      type="button"
                    >
                      <Check size={16} />
                      {subtask.status === 'completed' ? 'Completed' : 'Mark as Completed'}
                    </button>
                    <button
                      className="secondary-button"
                      disabled={actionTaskId === task.id}
                      onClick={() => onOpenSubtaskNote(task, subtask)}
                      type="button"
                    >
                      <NotebookPen size={16} />
                      {subtask.note?.trim() ? 'View Sub-task Note' : 'Add Sub-task Note'}
                    </button>
                    <button
                      className="danger-button ghost-button"
                      disabled={actionTaskId === task.id}
                      onClick={() => onDeleteSubtask(task, subtask)}
                      type="button"
                    >
                      <Trash2 size={16} />
                      Delete Sub-task
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
              className="danger-button"
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
    </article>
  );
}

export default TaskCard;
