import type { Project } from '@/types/project';
import TaskCard from '@/components/TaskCard';
import type { Subtask, Task, TaskWorkflowStatus } from '@/types/task';
import { flattenProjectLabels } from '@/utils/projectTree';

interface TaskListProps {
  actionTaskId: string | null;
  onDeleteSubtask: (task: Task, subtask: Subtask) => void;
  onOpenNotesList: () => void;
  onOpenSubtaskNotesList: () => void;
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
  onOpenNotesList,
  onOpenSubtaskNotesList,
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
      <div className="task-list-toolbar">
        <button className="secondary-button" onClick={onOpenNotesList} type="button">
          Task notes
        </button>
        <button className="secondary-button" onClick={onOpenSubtaskNotesList} type="button">
          Subtask notes
        </button>
      </div>
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
    </div>
  );
}

export default TaskList;
