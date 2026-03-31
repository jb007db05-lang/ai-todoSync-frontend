import { useState } from 'react';

import ActionGroup from '@/components/ActionGroup';
import SourceBadge from '@/components/SourceBadge';
import {
  TASK_WORKFLOW_STATUS_OPTIONS,
  type Subtask,
  type Task,
  type TaskWorkflowStatus
} from '@/types/task';

interface TaskCardProps {
  actionTaskId: string | null;
  onCreateSubtask: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (task: Task, status: TaskWorkflowStatus) => void;
  onUpdateSubtaskStatus: (task: Task, subtask: Subtask, status: TaskWorkflowStatus) => void;
  projectName?: string;
  task: Task;
}

function TaskCard({
  actionTaskId,
  onCreateSubtask,
  onDelete,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  projectName,
  task
}: TaskCardProps): JSX.Element {
  const completedSubtasks = task.subtasks.filter((subtask) => subtask.completed).length;
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`task-card accordion-card ${expanded ? 'accordion-open' : ''}`}>
      <button className="accordion-trigger" onClick={() => setExpanded((current) => !current)} type="button">
        <div className="task-heading">
          <h3>{task.title}</h3>
          <p className="muted-text">{task.description || 'No description provided.'}</p>
          {projectName ? <p className="task-project-label">Project: {projectName}</p> : null}
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
          {task.subtasks.length ? (
            <div className="subtask-list">
              {task.subtasks.map((subtask) => (
                <label className="subtask-row" key={subtask.id || subtask.title}>
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
              ))}
            </div>
          ) : (
            <p className="empty-state compact-empty-state">No subtasks yet for this task.</p>
          )}
          <ActionGroup>
            <button className="secondary-button" onClick={() => onCreateSubtask(task)} type="button">
              Add subtask
            </button>
            <button
              className="danger-button"
              disabled={actionTaskId === task.id}
              onClick={() => onDelete(task.id)}
              type="button"
            >
              {actionTaskId === task.id ? 'Deleting...' : 'Delete task'}
            </button>
          </ActionGroup>
        </div>
      ) : null}
    </article>
  );
}

export default TaskCard;
