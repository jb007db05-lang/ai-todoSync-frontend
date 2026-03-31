import type { Project } from '@/types/project';
import TaskCard from '@/components/TaskCard';
import type { Subtask, Task, TaskWorkflowStatus } from '@/types/task';
import { flattenProjectLabels } from '@/utils/projectTree';

interface TaskListProps {
  actionTaskId: string | null;
  onCreateSubtask: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (task: Task, status: TaskWorkflowStatus) => void;
  onUpdateSubtaskStatus: (task: Task, subtask: Subtask, status: TaskWorkflowStatus) => void;
  projects: Project[];
  tasks: Task[];
}

function TaskList({
  actionTaskId,
  onCreateSubtask,
  onDelete,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  projects,
  tasks
}: TaskListProps): JSX.Element {
  const projectNames = new Map(flattenProjectLabels(projects).map((project) => [project.id, project.label]));

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskCard
          actionTaskId={actionTaskId}
          key={task.id}
          onCreateSubtask={onCreateSubtask}
          onDelete={onDelete}
          onUpdateStatus={onUpdateStatus}
          onUpdateSubtaskStatus={onUpdateSubtaskStatus}
          projectName={task.projectId ? projectNames.get(task.projectId) : undefined}
          task={task}
        />
      ))}
    </div>
  );
}

export default TaskList;
