import TaskCard from '@/components/TaskCard';
import type { Task } from '@/types/task';

interface TaskListProps {
  actionTaskId: string | null;
  onDelete: (taskId: string) => void;
  onToggleStatus: (task: Task) => void;
  tasks: Task[];
}

function TaskList({ actionTaskId, onDelete, onToggleStatus, tasks }: TaskListProps): JSX.Element {
  return (
    <div className="task-list" style={{ width: "50%" }}>
{
  tasks.map((task) => (
    <TaskCard
      actionTaskId={actionTaskId}
      key={task.id}
      onDelete={onDelete}
      onToggleStatus={onToggleStatus}
      task={task}
    />
  ))
}
    </div >
  );
}

export default TaskList;
