import { Calendar, List } from 'lucide-react';

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
  onOpenEpicNotes: (epic: Epic) => void;
  onOpenProjectNotes: (project: Project) => void;
  onOpenSubtaskNote: (task: Task, subtask: Subtask) => void;
  onOpenTaskNote: (task: Task) => void;
  onUpdateEpic: (task: Task, epicId: string | null) => void;
  onUpdateStatus: (task: Task, status: TaskWorkflowStatus) => void;
  onUpdateSubtaskStatus: (task: Task, subtask: Subtask, status: TaskWorkflowStatus) => void;
  projects: Project[];
  tasks: Task[];
  onSelectTask?: (task: Task) => void;
  selectedTaskId?: string | null;
}

function TaskList({
  actionTaskId,
  epics,
  onDeleteSubtask,
  onCreateSubtask,
  onDelete,
  onOpenEpicNotes,
  onOpenProjectNotes,
  onOpenSubtaskNote,
  onOpenTaskNote,
  onUpdateEpic,
  onUpdateStatus,
  onUpdateSubtaskStatus,
  projects,
  tasks,
  onSelectTask,
  selectedTaskId
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

  const projectSections = (() => {
    const tasksByProject = new Map<string | null, Task[]>();

    tasks.forEach((task) => {
      const key = task.projectId ?? null;
      const current = tasksByProject.get(key) ?? [];
      current.push(task);
      tasksByProject.set(key, current);
    });

    const sections: Array<{
      id: string;
      project: Project | null;
      title: string;
      description: string;
      tasks: Task[];
    }> = [];

    projects.forEach((project) => {
      const projectTasks = tasksByProject.get(project.id) ?? [];

      if (projectTasks.length > 0) {
        sections.push({
          id: project.id,
          project,
          title: project.name,
          description: 'Project execution lane for the selected date.',
          tasks: projectTasks
        });
      }
    });

    const noProjectTasks = tasksByProject.get(null) ?? [];

    if (noProjectTasks.length > 0) {
      sections.push({
        id: 'no-project',
        project: null,
        title: 'No Project',
        description: 'Tasks that are not assigned to a project.',
        tasks: noProjectTasks
      });
    }

    return sections;
  })();

  return (
    <div className="task-list-shell">
      {tasks.length === 0 ? (
        <EmptyState
          description="Create a task or switch the active project to start planning work for this date."
          icon={Calendar}
          title="No tasks in this view"
        />
      ) : (
        <div className="task-list" style={{ marginTop: 0 }}>
          {projectSections.length > 0 ? (
            projectSections.map((section) => {
              const tasksByEpicId = new Map<string | null, Task[]>();

              section.tasks.forEach((task) => {
                const key = task.epicId ?? null;
                const current = tasksByEpicId.get(key) ?? [];
                current.push(task);
                tasksByEpicId.set(key, current);
              });

              const sectionEpics =
                section.project == null
                  ? []
                  : (orderedProjectEpics.get(section.project.id) ?? [])
                      .filter((epic) => tasksByEpicId.has(epic.id))
                      .map((epic) => ({
                        id: epic.id,
                        epic,
                        title: epic.name,
                        description: epic.description?.trim() ? epic.description : 'Grouped task execution lane.',
                        tasks: tasksByEpicId.get(epic.id) ?? []
                      }));

              const noEpicTasks = tasksByEpicId.get(null) ?? [];

              const sectionGroups = [
                ...sectionEpics,
                ...(noEpicTasks.length > 0
                  ? [
                      {
                        id: `${section.id}-no-epic`,
                        epic: null,
                        title: 'No Epic',
                        description:
                          section.project == null
                            ? 'Tasks without project or epic assignment.'
                            : 'Tasks in this project that are not assigned to an epic.',
                        tasks: noEpicTasks
                      }
                    ]
                  : [])
              ];

              return (
                <section className="project-group" key={section.id}>
                  <div className="project-group-header">
                    <div>
                      <span className="project-list-kicker">Project</span>
                      <h3>{section.title}</h3>
                      <p className="muted-text">{section.description}</p>
                    </div>
                    <div className="project-group-meta">
                      <span className="accordion-count">{section.tasks.length} task(s)</span>
                      {section.project ? (
                        <button className="secondary-button" onClick={() => onOpenProjectNotes(section.project as Project)} type="button">
                          Project notes
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="task-list">
                    {sectionGroups.map((group) => (
                      <section className="epic-group" key={group.id}>
                        <div className="epic-group-header">
                          <div>
                            <span className="project-list-kicker">Epic</span>
                            <h3>{group.title}</h3>
                            <p className="muted-text">{group.description}</p>
                          </div>
                          <div className="project-group-meta">
                            <span className="accordion-count">{group.tasks.length} task(s)</span>
                            {group.epic ? (
                              <button className="secondary-button" onClick={() => onOpenEpicNotes(group.epic as Epic)} type="button">
                                Epic notes
                              </button>
                            ) : null}
                          </div>
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
                              onSelect={onSelectTask}
                              isSelected={selectedTaskId === task.id}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </section>
              );
            })
          ) : (
            <div className="task-list">
              {tasks.map((task) => (
                <TaskCard
                  actionTaskId={actionTaskId}
                  availableEpics={[]}
                  key={task.id}
                  onCreateSubtask={onCreateSubtask}
                  onDelete={onDelete}
                  onDeleteSubtask={onDeleteSubtask}
                  onOpenSubtaskNote={onOpenSubtaskNote}
                  onOpenTaskNote={onOpenTaskNote}
                  onUpdateEpic={onUpdateEpic}
                  onUpdateStatus={onUpdateStatus}
                  onUpdateSubtaskStatus={onUpdateSubtaskStatus}
                  task={task}
                  onSelect={onSelectTask}
                  isSelected={selectedTaskId === task.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskList;
