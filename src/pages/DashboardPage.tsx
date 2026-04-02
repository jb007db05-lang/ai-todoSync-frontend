import { useCallback, useEffect, useMemo, useState } from 'react';

import AddTaskForm from '@/components/AddTaskForm';
import DateNavigator from '@/components/DateNavigator';
import DaySummary from '@/components/DaySummary';
import Modal from '@/components/Modal';
import Navbar from '@/components/Navbar';
import NoteModal from '@/components/NoteModal';
import ProjectForm from '@/components/ProjectForm';
import ProjectNotes from '@/components/ProjectNotes';
import ProjectPanel from '@/components/ProjectPanel';
import SectionCard from '@/components/SectionCard';
import SubtaskForm from '@/components/SubtaskForm';
import TaskList from '@/components/TaskList';
import TaskNotesList from '@/components/TaskNotesList';
import { createNote, deleteNote, getNote, getProjectNotes, updateNote } from '@/services/notes';
import { createProject, deleteProject, getProjects } from '@/services/projects';
import { createTask, deleteTask, getTaskSummary, getTasks, updateTask } from '@/services/tasks';
import type { Note } from '@/types/note';
import type { Project } from '@/types/project';
import type { Task, TaskSummary, TaskWorkflowStatus } from '@/types/task';
import { findProjectByName } from '@/utils/projectTree';

type ActiveNoteEditor =
  | {
      kind: 'project';
      note: Note | null;
      projectId: string;
      projectName: string;
    }
  | {
      kind: 'task';
      task: Task;
    }
  | {
      kind: 'subtask';
      subtask: Task['subtasks'][number];
      task: Task;
    };

interface TaskNotesModalState {
  noteType: 'task' | 'subtask';
  tasks: Task[];
  title: string;
}

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

function DashboardPage(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summary, setSummary] = useState<TaskSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);
  const [actionProjectId, setActionProjectId] = useState<string | null>(null);
  const [actionNoteId, setActionNoteId] = useState<string | null>(null);
  const [taskMutationError, setTaskMutationError] = useState<string | null>(null);
  const [taskMutationSuccess, setTaskMutationSuccess] = useState<string | null>(null);
  const [projectMutationError, setProjectMutationError] = useState<string | null>(null);
  const [projectMutationSuccess, setProjectMutationSuccess] = useState<string | null>(null);
  const [noteMutationError, setNoteMutationError] = useState<string | null>(null);
  const [noteMutationSuccess, setNoteMutationSuccess] = useState<string | null>(null);
  const [isProjectCreateModalOpen, setIsProjectCreateModalOpen] = useState(false);
  const [isTaskCreateModalOpen, setIsTaskCreateModalOpen] = useState(false);
  const [activeProjectViewId, setActiveProjectViewId] = useState<string | null | undefined>(undefined);
  const [taskModalProjectId, setTaskModalProjectId] = useState<string | null>(null);
  const [subtaskModalTask, setSubtaskModalTask] = useState<Task | null>(null);
  const [projectNotes, setProjectNotes] = useState<Record<string, Note[]>>({});
  const [notesLoadingProjectId, setNotesLoadingProjectId] = useState<string | null>(null);
  const [activeNoteEditor, setActiveNoteEditor] = useState<ActiveNoteEditor | null>(null);
  const [taskNotesModalState, setTaskNotesModalState] = useState<TaskNotesModalState | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [taskList, taskSummary, projectList] = await Promise.all([
        getTasks(selectedDate),
        getTaskSummary(selectedDate),
        getProjects()
      ]);
      setTasks(taskList);
      setSummary(taskSummary);
      setProjects(projectList);
    } catch {
      setError('Unable to load tasks for the selected day.');
      setTasks([]);
      setSummary(null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleCreateTask = async (payload: {
    title: string;
    description?: string;
    note?: string;
    status?: TaskWorkflowStatus;
    projectId?: string | null;
    subtasks?: Array<{ title: string; note?: string; status?: TaskWorkflowStatus }>;
  }): Promise<void> => {
    await createTask({
      title: payload.title,
      description: payload.description,
      note: payload.note,
      date: selectedDate,
      status: payload.status,
      source: 'manual',
      projectId: payload.projectId,
      subtasks: payload.subtasks
    });
    await loadDashboard();
    setIsTaskCreateModalOpen(false);
  };

  const handleCreateProject = async (payload: { name: string }): Promise<void> => {
    setActionProjectId('new');
    setProjectMutationError(null);
    setProjectMutationSuccess(null);

    try {
      const existingProject = findProjectByName(projects, payload.name);

      if (existingProject) {
        setProjectMutationSuccess('Project already exists.');
        setIsProjectCreateModalOpen(false);
        return;
      }

      await createProject(payload);
      await loadDashboard();
      setProjectMutationSuccess('Project created.');
      setIsProjectCreateModalOpen(false);
    } catch {
      setProjectMutationError('Unable to create the project.');
    } finally {
      setActionProjectId(null);
    }
  };

  const handleDeleteProject = async (projectId: string): Promise<void> => {
    setActionProjectId(projectId);
    setProjectMutationError(null);
    setProjectMutationSuccess(null);
    setNoteMutationError(null);
    setNoteMutationSuccess(null);

    try {
      await deleteProject(projectId);
      await loadDashboard();
      setProjectNotes((current) => {
        const next = { ...current };
        delete next[projectId];
        return next;
      });

      if (activeProjectViewId === projectId) {
        setActiveProjectViewId(undefined);
      }

      setProjectMutationSuccess('Project deleted. Related tasks and notes were removed.');
    } catch {
      setProjectMutationError('Unable to delete the project.');
    } finally {
      setActionProjectId(null);
    }
  };

  const handleUpdateTaskStatus = async (task: Task, status: TaskWorkflowStatus): Promise<void> => {
    setActionTaskId(task.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      const updates =
        status === 'completed'
          ? {
              status,
              subtasks: task.subtasks.map((subtask) => ({
                title: subtask.title,
                note: subtask.note,
                status: 'completed' as const,
                completedAt: subtask.completedAt ?? new Date().toISOString()
              }))
            }
          : { status };

      await updateTask(task.id, updates);
      await loadDashboard();
      setTaskMutationSuccess('Task status updated.');
    } catch {
      setTaskMutationError('Unable to update the task status.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    setActionTaskId(taskId);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      await deleteTask(taskId);
      await loadDashboard();
      setTaskMutationSuccess('Task deleted.');
    } catch {
      setTaskMutationError('Unable to delete the task.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleUpdateSubtaskStatus = async (
    task: Task,
    targetSubtask: Task['subtasks'][number],
    status: TaskWorkflowStatus
  ): Promise<void> => {
    setActionTaskId(task.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      const subtasks = task.subtasks.map((subtask) => {
        if (subtask.id !== targetSubtask.id) {
          return {
            title: subtask.title,
            note: subtask.note,
            status: subtask.status,
            completedAt: subtask.completedAt
          };
        }

        return {
          title: subtask.title,
          note: subtask.note,
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : null
        };
      });

      await updateTask(task.id, { subtasks });
      await loadDashboard();
      setTaskMutationSuccess('Subtask updated.');
    } catch {
      setTaskMutationError('Unable to update the subtask.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleCreateSubtask = async (payload: {
    title: string;
    note?: string;
    status: TaskWorkflowStatus;
  }): Promise<void> => {
    if (subtaskModalTask == null) {
      return;
    }

    setActionTaskId(subtaskModalTask.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      await updateTask(subtaskModalTask.id, {
        subtasks: [
          ...subtaskModalTask.subtasks.map((subtask) => ({
            title: subtask.title,
            note: subtask.note,
            status: subtask.status,
            completedAt: subtask.completedAt
          })),
          {
            title: payload.title,
            note: payload.note,
            status: payload.status,
            completedAt: payload.status === 'completed' ? new Date().toISOString() : null
          }
        ]
      });
      await loadDashboard();
      setSubtaskModalTask(null);
      setTaskMutationSuccess('Subtask created.');
    } catch {
      setTaskMutationError('Unable to create the subtask.');
    } finally {
      setActionTaskId(null);
    }
  };

  const loadNotesForProject = useCallback(async (projectId: string): Promise<void> => {
    setNotesLoadingProjectId(projectId);

    try {
      const notes = await getProjectNotes(projectId);
      setProjectNotes((current) => ({
        ...current,
        [projectId]: notes
      }));
    } catch {
      setNoteMutationError('Unable to load notes for this project.');
    } finally {
      setNotesLoadingProjectId((current) => (current === projectId ? null : current));
    }
  }, []);

  const handleOpenProject = (projectId: string | null): void => {
    setActiveProjectViewId(projectId);
    setNoteMutationError(null);
    setNoteMutationSuccess(null);

    if (projectId && projectNotes[projectId] == null) {
      void loadNotesForProject(projectId);
    }
  };

  const handleOpenCreateNote = (): void => {
    if (activeProjectViewId == null || activeProject == null) {
      return;
    }

    setNoteMutationError(null);
    setNoteMutationSuccess(null);
    setActiveNoteEditor({
      kind: 'project',
      note: null,
      projectId: activeProjectViewId,
      projectName: activeProject.name
    });
  };

  const handleOpenExistingNote = async (note: Note): Promise<void> => {
    setActionNoteId(note.id);
    setNoteMutationError(null);
    setNoteMutationSuccess(null);

    try {
      const latestNote = await getNote(note.id);
      const projectName =
        projects.find((project) => project.id === latestNote.projectId)?.name ?? activeProject?.name ?? 'Project';
      setActiveNoteEditor({
        kind: 'project',
        note: latestNote,
        projectId: latestNote.projectId,
        projectName
      });
    } catch {
      setNoteMutationError('Unable to open the note.');
    } finally {
      setActionNoteId(null);
    }
  };

  const handleSaveNote = async (payload: {
    appendContent?: boolean;
    title?: string;
    content: string;
  }): Promise<void> => {
    if (activeNoteEditor == null) {
      return;
    }

    const editor = activeNoteEditor;
    setActionNoteId(editor.kind === 'project' ? editor.note?.id ?? 'new' : null);
    setNoteMutationError(null);
    setNoteMutationSuccess(null);

    try {
      if (editor.kind === 'project') {
        if (editor.note) {
          const updated = await updateNote(editor.note.id, {
            appendContent: payload.appendContent,
            title: payload.title,
            content: payload.content
          });
          setProjectNotes((current) => ({
            ...current,
            [editor.projectId]: (current[editor.projectId] ?? []).map((note) => (note.id === updated.id ? updated : note))
          }));
          setNoteMutationSuccess(payload.appendContent ? 'Content appended to note.' : 'Note updated.');
        } else {
          const created = await createNote(editor.projectId, {
            title: payload.title ?? '',
            content: payload.content
          });
          setProjectNotes((current) => ({
            ...current,
            [editor.projectId]: [created, ...(current[editor.projectId] ?? [])]
          }));
          setNoteMutationSuccess('Note created.');
        }
      } else if (editor.kind === 'task') {
        await updateTask(editor.task.id, { note: payload.content });
        await loadDashboard();
        setTaskMutationSuccess(editor.task.note?.trim() ? 'Task note updated.' : 'Task note created.');
      } else {
        const latestTask = tasks.find((task) => task.id === editor.task.id) ?? editor.task;
        const subtasks = latestTask.subtasks.map((subtask) => ({
          title: subtask.title,
          note: subtask.id === editor.subtask.id ? payload.content : subtask.note,
          status: subtask.status,
          completedAt: subtask.completedAt
        }));

        await updateTask(latestTask.id, { subtasks });
        await loadDashboard();
        setTaskMutationSuccess(editor.subtask.note?.trim() ? 'Subtask note updated.' : 'Subtask note created.');
      }

      setActiveNoteEditor(null);
    } catch {
      setNoteMutationError('Unable to save the note.');
      throw new Error('Unable to save note');
    } finally {
      setActionNoteId(null);
    }
  };

  const handleDeleteNote = async (note: Note): Promise<void> => {
    setActionNoteId(note.id);
    setNoteMutationError(null);
    setNoteMutationSuccess(null);

    try {
      await deleteNote(note.id);
      setProjectNotes((current) => ({
        ...current,
        [note.projectId]: (current[note.projectId] ?? []).filter((currentNote) => currentNote.id !== note.id)
      }));

      if (activeNoteEditor?.kind === 'project' && activeNoteEditor.note?.id === note.id) {
        setActiveNoteEditor(null);
      }

      setNoteMutationSuccess('Note deleted.');
    } catch {
      setNoteMutationError('Unable to delete the note.');
    } finally {
      setActionNoteId(null);
    }
  };

  const handleOpenTaskNote = (task: Task): void => {
    setNoteMutationError(null);
    setNoteMutationSuccess(null);
    setTaskNotesModalState(null);
    setActiveNoteEditor({
      kind: 'task',
      task
    });
  };

  const handleOpenSubtaskNote = (task: Task, subtask: Task['subtasks'][number]): void => {
    setNoteMutationError(null);
    setNoteMutationSuccess(null);
    setTaskNotesModalState(null);
    setActiveNoteEditor({
      kind: 'subtask',
      task,
      subtask
    });
  };

  const hasTasks = tasks.length > 0;
  const tasksHeading = useMemo(() => `Tasks for ${selectedDate}`, [selectedDate]);
  const tasksByProject = useMemo(() => {
    const counts = new Map<string | null, number>();

    tasks.forEach((task) => {
      const key = task.projectId ?? null;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [tasks]);
  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectViewId) ?? null,
    [activeProjectViewId, projects]
  );
  const activeProjectTasks = useMemo(
    () =>
      tasks.filter((task) =>
        activeProjectViewId == null ? task.projectId == null : task.projectId === activeProjectViewId
      ),
    [activeProjectViewId, tasks]
  );
  const activeProjectModalTitle =
    activeProjectViewId == null ? 'Inbox Tasks' : activeProject?.name ?? 'Project Tasks';
  const activeProjectNotes = activeProjectViewId ? projectNotes[activeProjectViewId] ?? [] : [];
  const activeProjectNotesModalTitle =
    activeProjectViewId == null ? `Notes for ${activeProjectModalTitle}` : `Notes for ${activeProject?.name ?? 'Project Tasks'}`;

  return (
    <main className="stack">
      <Navbar />
      <SectionCard className="hero-card">
        <div className="hero-layout">
          <div className="hero-copy">
            <DaySummary
              controls={<DateNavigator date={selectedDate} disabled={loading} onChange={setSelectedDate} />}
              date={selectedDate}
              error={error}
              loading={loading}
              summary={summary}
            />
          </div>
        </div>
      </SectionCard>
      <div className="dashboard-columns">
        <SectionCard className="project-card">
          <ProjectPanel
            actionProjectId={actionProjectId}
            loading={loading}
            onOpenCreateProject={() => setIsProjectCreateModalOpen(true)}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            projects={projects}
            tasksByProject={tasksByProject}
          />
        </SectionCard>
        <SectionCard className="workspace-card">
          <div className="card-header">
            <div>
              <h2>{tasksHeading}</h2>
            </div>
            <button
              onClick={() => {
                setTaskModalProjectId(null);
                setIsTaskCreateModalOpen(true);
              }}
              type="button"
            >
              New task
            </button>
          </div>
          <div className="workspace-notices">
            {projectMutationSuccess ? <p className="success-text">{projectMutationSuccess}</p> : null}
            {projectMutationError ? <p className="error-text">{projectMutationError}</p> : null}
            {taskMutationSuccess ? <p className="success-text">{taskMutationSuccess}</p> : null}
            {taskMutationError ? <p className="error-text">{taskMutationError}</p> : null}
            {noteMutationSuccess ? <p className="success-text">{noteMutationSuccess}</p> : null}
            {noteMutationError ? <p className="error-text">{noteMutationError}</p> : null}
            {loading ? <p className="muted-text">Refreshing tasks for {selectedDate}...</p> : null}
          </div>
          {!loading && !hasTasks ? (
            <p className="empty-state">No tasks for this day yet. Create a project or open the task modal to add one.</p>
          ) : (
            <p className="workspace-hint">The dashboard stays project-first. Click a project card or Inbox to open its task list modal.</p>
          )}
          {!loading && hasTasks ? (
            <TaskList
              actionTaskId={actionTaskId}
              onOpenNotesList={() =>
                setTaskNotesModalState({ noteType: 'task', tasks, title: `Task notes for ${tasksHeading}` })
              }
              onOpenSubtaskNotesList={() =>
                setTaskNotesModalState({ noteType: 'subtask', tasks, title: `Subtask notes for ${tasksHeading}` })
              }
              onCreateSubtask={(task) => setSubtaskModalTask(task)}
              onDelete={(taskId) => void handleDeleteTask(taskId)}
              onOpenSubtaskNote={(task, subtask) => handleOpenSubtaskNote(task, subtask)}
              onOpenTaskNote={(task) => handleOpenTaskNote(task)}
              onUpdateStatus={(task, status) => void handleUpdateTaskStatus(task, status)}
              onUpdateSubtaskStatus={(task, subtask, status) =>
                void handleUpdateSubtaskStatus(task, subtask, status)
              }
              projects={projects}
              tasks={tasks}
            />
          ) : null}
        </SectionCard>
      </div>
      {isProjectCreateModalOpen ? (
        <Modal onClose={() => setIsProjectCreateModalOpen(false)} title="Create Project">
          <ProjectForm onSubmit={handleCreateProject} />
        </Modal>
      ) : null}
      {isTaskCreateModalOpen ? (
        <Modal onClose={() => setIsTaskCreateModalOpen(false)} title="Create Task">
          <AddTaskForm initialProjectId={taskModalProjectId} onCreateTask={handleCreateTask} projects={projects} />
        </Modal>
      ) : null}
      {activeProjectViewId !== undefined ? (
        <Modal onClose={() => setActiveProjectViewId(undefined)} title={activeProjectModalTitle}>
          <div className="project-task-modal">
            <div className="project-view-grid">
              {activeProject ? (
                <ProjectNotes
                  actionNoteId={actionNoteId}
                  loading={notesLoadingProjectId === activeProject.id}
                  notes={activeProjectNotes}
                  onCreateNote={handleOpenCreateNote}
                  onDeleteNote={(note) => void handleDeleteNote(note)}
                  onOpenNote={(note) => void handleOpenExistingNote(note)}
                />
              ) : null}
              <div className="project-view-tasks">
                <div className="modal-inline-actions">
                  <button
                    onClick={() => {
                      setTaskModalProjectId(activeProjectViewId ?? null);
                      setIsTaskCreateModalOpen(true);
                    }}
                    type="button"
                  >
                    {activeProjectViewId == null ? 'New inbox task' : 'New task for this project'}
                  </button>
                </div>
                {activeProjectTasks.length ? (
                  <TaskList
                    actionTaskId={actionTaskId}
                    onOpenNotesList={() =>
                      setTaskNotesModalState({
                        noteType: 'task',
                        tasks: activeProjectTasks,
                        title: `Task notes for ${activeProjectNotesModalTitle}`
                      })
                    }
                    onOpenSubtaskNotesList={() =>
                      setTaskNotesModalState({
                        noteType: 'subtask',
                        tasks: activeProjectTasks,
                        title: `Subtask notes for ${activeProjectNotesModalTitle}`
                      })
                    }
                    onCreateSubtask={(task) => setSubtaskModalTask(task)}
                    onDelete={(taskId) => void handleDeleteTask(taskId)}
                    onOpenSubtaskNote={(task, subtask) => handleOpenSubtaskNote(task, subtask)}
                    onOpenTaskNote={(task) => handleOpenTaskNote(task)}
                    onUpdateStatus={(task, status) => void handleUpdateTaskStatus(task, status)}
                    onUpdateSubtaskStatus={(task, subtask, status) =>
                      void handleUpdateSubtaskStatus(task, subtask, status)
                    }
                    projects={projects}
                    tasks={activeProjectTasks}
                  />
                ) : (
                  <p className="empty-state">No tasks in this view yet. Create one from this modal.</p>
                )}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
      {subtaskModalTask ? (
        <Modal
          backdropClassName="subtask-modal-backdrop"
          panelClassName="subtask-modal-panel"
          onClose={() => setSubtaskModalTask(null)}
          title={`Create Subtask for ${subtaskModalTask.title}`}
        >
          <SubtaskForm onSubmit={handleCreateSubtask} />
        </Modal>
      ) : null}
      {activeNoteEditor ? (
        <NoteModal
          allowAppend={activeNoteEditor.kind === 'project' && activeNoteEditor.note != null}
          entityLabel={
            activeNoteEditor.kind === 'project'
              ? activeNoteEditor.projectName
              : activeNoteEditor.kind === 'task'
                ? activeNoteEditor.task.title
                : `${activeNoteEditor.task.title} / ${activeNoteEditor.subtask.title}`
          }
          modalTitle={
            activeNoteEditor.kind === 'project'
              ? activeNoteEditor.note
                ? 'Edit Project Note'
                : 'Create Project Note'
              : activeNoteEditor.kind === 'task'
                ? activeNoteEditor.task.note?.trim()
                  ? 'Task Note'
                  : 'Create Task Note'
                : activeNoteEditor.subtask.note?.trim()
                  ? 'Subtask Note'
                  : 'Create Subtask Note'
          }
          note={
            activeNoteEditor.kind === 'project'
              ? activeNoteEditor.note
              : activeNoteEditor.kind === 'task'
                ? { title: '', content: activeNoteEditor.task.note ?? '' }
                : { title: '', content: activeNoteEditor.subtask.note ?? '' }
          }
          onClose={() => {
            setActiveNoteEditor(null);
          }}
          onSave={handleSaveNote}
          showTitle={activeNoteEditor.kind === 'project'}
          titlePlaceholder="Sprint recap"
        />
      ) : null}
      {taskNotesModalState ? (
        <Modal onClose={() => setTaskNotesModalState(null)} title={taskNotesModalState.title}>
          <TaskNotesList
            noteType={taskNotesModalState.noteType}
            onOpenSubtaskNote={handleOpenSubtaskNote}
            onOpenTaskNote={handleOpenTaskNote}
            tasks={taskNotesModalState.tasks}
          />
        </Modal>
      ) : null}
    </main>
  );
}

export default DashboardPage;
