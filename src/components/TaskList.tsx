import { ClipboardList } from 'lucide-react';

import EmptyState from '@/components/EmptyState';
import TaskCard from '@/components/TaskCard';
import type { Project } from '@/types/project';
import type { Subtask, Task, TaskWorkflowStatus } from '@/types/task';
import { flattenProjectLabels } from '@/utils/projectTree';

interface TaskListProps {
  actionTaskId: string | null;
  onDeleteSubtask: (task: Task, subtask: Subtask) => void;
  onCreateSubtask: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenSubtaskNote: (task: Task, subtask: Subtask) => void;
  onOpenTaskNote: (task: Task) => void;
  onUpdateStatus: (task: Task, status: TaskWorkflowStatus) => void;
  onUpdateSubtaskStatus: (task: Task, subtask: Subtask, status: TaskWorkflowStatus) => void;
  projects: Project[];
  tasks: Task[];
}

function TaskList({
  actionTaskId,
  onDeleteSubtask,
  onCreateSubtask,
  onDelete,
  onOpenSubtaskNote,
  onOpenTaskNote,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  projects,
  tasks
}: TaskListProps): JSX.Element {
  const projectNames = new Map(flattenProjectLabels(projects).map((project) => [project.id, project.label]));

  return (
    <div className="task-list-shell">
      {tasks.length === 0 ? (
        <EmptyState
          description="Create a task or switch the active project to start planning work for this date."
          icon={ClipboardList}
          title="No tasks in this view"
        />
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskCard
              actionTaskId={actionTaskId}
              key={task.id}
              onCreateSubtask={onCreateSubtask}
              onDelete={onDelete}
              onDeleteSubtask={onDeleteSubtask}
              onOpenSubtaskNote={onOpenSubtaskNote}
              onOpenTaskNote={onOpenTaskNote}
              onUpdateStatus={onUpdateStatus}
              onUpdateSubtaskStatus={onUpdateSubtaskStatus}
              projectName={task.projectId ? projectNames.get(task.projectId) : undefined}
              task={task}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskList;
