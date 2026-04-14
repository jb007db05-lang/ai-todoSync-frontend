import { ClipboardList } from 'lucide-react';

import EmptyState from '@/components/EmptyState';
import TaskCard from '@/components/TaskCard';
import type { Epic } from '@/types/epic';
import type { Project } from '@/types/project';
import type { Subtask, Task, TaskWorkflowStatus } from '@/types/task';
import { flattenProjectLabels } from '@/utils/projectTree';

interface TaskListProps {
  actionTaskId: string | null;
  epics: Epic[];
  onDeleteSubtask: (task: Task, subtask: Subtask) => void;
  onCreateSubtask: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onOpenSubtaskNote: (task: Task, subtask: Subtask) => void;
  onOpenTaskNote: (task: Task) => void;
  onUpdateEpic: (task: Task, epicId: string | null) => void;
  onUpdateStatus: (task: Task, status: TaskWorkflowStatus) => void;
  onUpdateSubtaskStatus: (task: Task, subtask: Subtask, status: TaskWorkflowStatus) => void;
  projects: Project[];
  tasks: Task[];
}

function TaskList({
  actionTaskId,
  epics,
  onDeleteSubtask,
  onCreateSubtask,
  onDelete,
  onOpenSubtaskNote,
  onOpenTaskNote,
  onUpdateEpic,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  projects,
  tasks
}: TaskListProps): JSX.Element {
  const projectNames = new Map(flattenProjectLabels(projects).map((project) => [project.id, project.label]));
  const epicsByProject = new Map<string, Epic[]>();
  const epicById = new Map(epics.map((epic) => [epic.id, epic]));

  epics.forEach((epic) => {
    const current = epicsByProject.get(epic.projectId) ?? [];
    current.push(epic);
    epicsByProject.set(epic.projectId, current);
  });

  const orderedProjectEpics = new Map(
    Array.from(epicsByProject.entries()).map(([projectId, projectEpics]) => [
      projectId,
      [...projectEpics].sort((left, right) => left.order - right.order)
    ])
  );

  const groupedTasks = (() => {
    const tasksByEpicId = new Map<string | null, Task[]>();

    tasks.forEach((task) => {
      const key = task.epicId ?? null;
      const current = tasksByEpicId.get(key) ?? [];
      current.push(task);
      tasksByEpicId.set(key, current);
    });

    const epicGroups = epics
      .filter((epic) => tasksByEpicId.has(epic.id))
      .sort((left, right) => left.order - right.order)
      .map((epic) => ({
        id: epic.id,
        title: epic.name,
        description: epic.description,
        tasks: tasksByEpicId.get(epic.id) ?? []
      }));

    const noEpicTasks = tasksByEpicId.get(null) ?? [];

    if (noEpicTasks.length > 0) {
      epicGroups.push({
        id: 'no-epic',
        title: 'No Epic',
        description: 'Tasks in this project or view that are not assigned to an epic.',
        tasks: noEpicTasks
      });
    }

    return epicGroups;
  })();

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
          {groupedTasks.map((group) => (
            <section className="epic-group" key={group.id}>
              <div className="epic-group-header">
                <div>
                  <span className="project-list-kicker">Epic</span>
                  <h3>{group.title}</h3>
                  <p className="muted-text">{group.description?.trim() ? group.description : 'Grouped task execution lane.'}</p>
                </div>
                <span className="accordion-count">{group.tasks.length} task(s)</span>
              </div>
              <div className="task-list">
                {group.tasks.map((task) => (
                  <TaskCard
                    actionTaskId={actionTaskId}
                    availableEpics={task.projectId ? orderedProjectEpics.get(task.projectId) ?? [] : []}
                    epicName={task.epicId ? epicById.get(task.epicId)?.name : undefined}
                    key={task.id}
                    onCreateSubtask={onCreateSubtask}
                    onDelete={onDelete}
                    onDeleteSubtask={onDeleteSubtask}
                    onOpenSubtaskNote={onOpenSubtaskNote}
                    onOpenTaskNote={onOpenTaskNote}
                    onUpdateEpic={onUpdateEpic}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateSubtaskStatus={onUpdateSubtaskStatus}
                    projectName={task.projectId ? projectNames.get(task.projectId) : undefined}
                    task={task}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskList;
