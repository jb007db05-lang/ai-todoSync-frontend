import ActionGroup from '@/components/ActionGroup';
import SourceBadge from '@/components/SourceBadge';
import type { Task } from '@/types/task';

interface TaskCardProps {
  actionTaskId: string | null;
  onDelete: (taskId: string) => void;
  onToggleStatus: (task: Task) => void;
  task: Task;
}

function TaskCard({ actionTaskId, onDelete, onToggleStatus, task }: TaskCardProps): JSX.Element {
  return (
    <article className="task-card">
      <div className="card-header">
        <div>
          <h3>{task.title}</h3>
          <p className="muted-text">{task.description || 'No description provided.'}</p>
        </div>
        <span className="status-pill">{task.status}</span>
      </div>
      <div className="task-meta">
        <SourceBadge source={task.source} />
        <span>Rollover count: {task.rolloverCount}</span>
      </div>
      <ActionGroup>
        <button disabled={actionTaskId === task.id} onClick={() => onToggleStatus(task)} type="button">
          {actionTaskId === task.id
            ? 'Saving...'
            : task.status === 'done'
              ? 'Move to pending'
              : 'Mark as done'}
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
    </article>
  );
}

export default TaskCard;
