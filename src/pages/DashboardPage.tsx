import { useCallback, useEffect, useMemo, useState } from 'react';

import AddTaskForm from '@/components/AddTaskForm';
import DateNavigator from '@/components/DateNavigator';
import EmptyState from '@/components/EmptyState';
import EpicForm from '@/components/EpicForm';
import EpicManager from '@/components/EpicManager';
import Modal from '@/components/Modal';
import Navbar from '@/components/Navbar';
import NoteModal from '@/components/NoteModal';
import PageHeader from '@/components/PageHeader';
import ProjectForm from '@/components/ProjectForm';
import ProjectNotes from '@/components/ProjectNotes';
import ProjectPanel from '@/components/ProjectPanel';
import SectionCard from '@/components/SectionCard';
import SubtaskForm from '@/components/SubtaskForm';
import TaskList from '@/components/TaskList';
import { ClipboardList } from 'lucide-react';
import { createEpic, deleteEpic, getEpics, reorderEpics, updateEpic } from '@/services/epics';
import { createNote, deleteNote, getNote, getProjectNotes, updateNote } from '@/services/notes';
import { createProject, deleteProject, getProjects, updateProject } from '@/services/projects';
import { createTask, deleteTask, getTasks, updateTask } from '@/services/tasks';
import type { Epic, EpicStatus } from '@/types/epic';
import type { Note } from '@/types/note';
import type { Project } from '@/types/project';
import type { Task, TaskWorkflowStatus } from '@/types/task';
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

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const requestConfirmation = (message: string): boolean => window.confirm(message);
const ALL_PROJECTS_VALUE = '__all__';

const deriveTaskStatusFromSubtasks = (
  currentStatus: Task['status'],
  subtasks: Array<{ status: TaskWorkflowStatus }>
): Task['status'] => {
  if (subtasks.length === 0) {
    return currentStatus;
  }

  if (subtasks.every((subtask) => subtask.status === 'completed')) {
    return 'completed';
  }

  if (currentStatus !== 'completed') {
    return currentStatus;
  }

  if (subtasks.some((subtask) => subtask.status === 'in_review')) {
    return 'in_review';
  }

  if (subtasks.some((subtask) => subtask.status === 'in_progress')) {
    return 'in_progress';
  }

  return 'pending';
};

function DashboardPage(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);
  const [actionProjectId, setActionProjectId] = useState<string | null>(null);
  const [actionEpicId, setActionEpicId] = useState<string | null>(null);
  const [actionNoteId, setActionNoteId] = useState<string | null>(null);
  const [taskMutationError, setTaskMutationError] = useState<string | null>(null);
  const [taskMutationSuccess, setTaskMutationSuccess] = useState<string | null>(null);
  const [projectMutationError, setProjectMutationError] = useState<string | null>(null);
  const [projectMutationSuccess, setProjectMutationSuccess] = useState<string | null>(null);
  const [epicMutationError, setEpicMutationError] = useState<string | null>(null);
  const [epicMutationSuccess, setEpicMutationSuccess] = useState<string | null>(null);
  const [noteMutationError, setNoteMutationError] = useState<string | null>(null);
  const [noteMutationSuccess, setNoteMutationSuccess] = useState<string | null>(null);
  const [isProjectCreateModalOpen, setIsProjectCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isEpicManagerOpen, setIsEpicManagerOpen] = useState(false);
  const [isEpicCreateModalOpen, setIsEpicCreateModalOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [isProjectNotesModalOpen, setIsProjectNotesModalOpen] = useState(false);
  const [isTaskCreateModalOpen, setIsTaskCreateModalOpen] = useState(false);
  const [selectedProjectView, setSelectedProjectView] = useState<string>(ALL_PROJECTS_VALUE);
  const [taskModalProjectId, setTaskModalProjectId] = useState<string | null>(null);
  const [subtaskModalTask, setSubtaskModalTask] = useState<Task | null>(null);
  const [projectNotes, setProjectNotes] = useState<Record<string, Note[]>>({});
  const [notesLoadingProjectId, setNotesLoadingProjectId] = useState<string | null>(null);
  const [activeNoteEditor, setActiveNoteEditor] = useState<ActiveNoteEditor | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [taskList, projectList] = await Promise.all([getTasks(selectedDate), getProjects()]);
      const epicGroups = await Promise.all(projectList.map((project) => getEpics(project.id)));
      setTasks(taskList);
      setProjects(projectList);
      setEpics(epicGroups.flat());
    } catch {
      setError('Unable to load tasks for the selected day.');
      setTasks([]);
      setProjects([]);
      setEpics([]);
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
    status?: TaskWorkflowStatus;
    projectId?: string | null;
    epicId?: string | null;
  }): Promise<void> => {
    await createTask({
      title: payload.title,
      description: payload.description,
      date: selectedDate,
      status: payload.status,
      source: 'manual',
      projectId: payload.projectId,
      epicId: payload.epicId
    });
    await loadDashboard();
    setIsTaskCreateModalOpen(false);
  };

  const handleCreateEpic = async (payload: {
    description?: string;
    name: string;
    status: EpicStatus;
  }): Promise<void> => {
    if (activeProject == null) {
      return;
    }

    setActionEpicId('new');
    setEpicMutationError(null);
    setEpicMutationSuccess(null);

    try {
      await createEpic(activeProject.id, payload);
      await loadDashboard();
      setEpicMutationSuccess('Epic created.');
      setIsEpicCreateModalOpen(false);
    } catch {
      setEpicMutationError('Unable to create the epic.');
      throw new Error('Unable to create epic');
    } finally {
      setActionEpicId(null);
    }
  };

  const handleUpdateEpic = async (payload: {
    description?: string;
    name: string;
    status: EpicStatus;
  }): Promise<void> => {
    if (activeProject == null || editingEpic == null) {
      return;
    }

    setActionEpicId(editingEpic.id);
    setEpicMutationError(null);
    setEpicMutationSuccess(null);

    try {
      await updateEpic(activeProject.id, editingEpic.id, payload);
      await loadDashboard();
      setEpicMutationSuccess('Epic updated.');
      setEditingEpic(null);
    } catch {
      setEpicMutationError('Unable to update the epic.');
      throw new Error('Unable to update epic');
    } finally {
      setActionEpicId(null);
    }
  };

  const handleDeleteEpic = async (epic: Epic): Promise<void> => {
    if (!requestConfirmation(`Delete epic "${epic.name}"? Tasks will remain and move to "No Epic".`)) {
      return;
    }

    setActionEpicId(epic.id);
    setEpicMutationError(null);
    setEpicMutationSuccess(null);

    try {
      await deleteEpic(epic.projectId, epic.id);
      await loadDashboard();
      setEpicMutationSuccess('Epic deleted. Related tasks were preserved and unassigned.');

      if (editingEpic?.id === epic.id) {
        setEditingEpic(null);
      }
    } catch {
      setEpicMutationError('Unable to delete the epic.');
    } finally {
      setActionEpicId(null);
    }
  };

  const handleMoveEpic = async (epic: Epic, direction: 'up' | 'down'): Promise<void> => {
    const projectEpics = epics
      .filter((currentEpic) => currentEpic.projectId === epic.projectId)
      .sort((left, right) => left.order - right.order);
    const index = projectEpics.findIndex((currentEpic) => currentEpic.id === epic.id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (index < 0 || targetIndex < 0 || targetIndex >= projectEpics.length) {
      return;
    }

    const reordered = [...projectEpics];
    const [movedEpic] = reordered.splice(index, 1);

    if (!movedEpic) {
      return;
    }

    reordered.splice(targetIndex, 0, movedEpic);

    setActionEpicId(epic.id);
    setEpicMutationError(null);
    setEpicMutationSuccess(null);

    try {
      await reorderEpics(epic.projectId, reordered.map((item) => item.id));
      await loadDashboard();
      setEpicMutationSuccess('Epic order updated.');
    } catch {
      setEpicMutationError('Unable to reorder epics.');
    } finally {
      setActionEpicId(null);
    }
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

  const handleUpdateProject = async (payload: { name: string }): Promise<void> => {
    if (editingProject == null) {
      return;
    }

    setActionProjectId(editingProject.id);
    setProjectMutationError(null);
    setProjectMutationSuccess(null);

    try {
      await updateProject(editingProject.id, payload);
      await loadDashboard();
      setProjectMutationSuccess('Project updated.');
      setEditingProject(null);
    } catch {
      setProjectMutationError('Unable to update the project.');
    } finally {
      setActionProjectId(null);
    }
  };

  const handleDeleteProject = async (projectId: string): Promise<void> => {
    const projectName = projects.find((project) => project.id === projectId)?.name ?? 'this project';

    if (!requestConfirmation(`Delete ${projectName}? This will remove the project, its tasks, and its notes.`)) {
      return;
    }

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
      setEpics((current) => current.filter((epic) => epic.projectId !== projectId));

      if (selectedProjectView === projectId) {
        setSelectedProjectView(ALL_PROJECTS_VALUE);
      }

      setActiveNoteEditor((current) => {
        if (current == null) {
          return null;
        }

        if (current.kind === 'project') {
          return current.projectId === projectId ? null : current;
        }

        return current.task.projectId === projectId ? null : current;
      });
      setSubtaskModalTask((current) => (current?.projectId === projectId ? null : current));
      setEditingEpic((current) => (current?.projectId === projectId ? null : current));

      if (activeProject?.id === projectId) {
        setIsEpicManagerOpen(false);
        setIsEpicCreateModalOpen(false);
      }

      setProjectMutationSuccess('Project deleted. Related tasks and notes were removed.');
    } catch {
      setProjectMutationError('Unable to delete the project.');
    } finally {
      setActionProjectId(null);
    }
  };

  const handleUpdateTaskStatus = async (task: Task, status: TaskWorkflowStatus): Promise<void> => {
    if (!requestConfirmation(`Update the status for "${task.title}" to "${status.replace('_', ' ')}"?`)) {
      return;
    }

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

  const handleUpdateTaskEpic = async (task: Task, epicId: string | null): Promise<void> => {
    setActionTaskId(task.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      await updateTask(task.id, {
        projectId: task.projectId,
        epicId
      });
      await loadDashboard();
      setTaskMutationSuccess(epicId ? 'Task epic updated.' : 'Task moved to No Epic.');
    } catch {
      setTaskMutationError('Unable to update the task epic.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    const taskTitle = tasks.find((task) => task.id === taskId)?.title ?? 'this task';

    if (!requestConfirmation(`Delete "${taskTitle}"?`)) {
      return;
    }

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
    if (
      !requestConfirmation(
        `Update the status for sub-task "${targetSubtask.title}" in "${task.title}" to "${status.replace('_', ' ')}"?`
      )
    ) {
      return;
    }

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

      await updateTask(task.id, {
        status: deriveTaskStatusFromSubtasks(task.status, subtasks),
        subtasks
      });
      await loadDashboard();
      setTaskMutationSuccess('Subtask updated.');
    } catch {
      setTaskMutationError('Unable to update the subtask.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleCreateSubtask = async (
    payload: Array<{ title: string; status: TaskWorkflowStatus }>
  ): Promise<void> => {
    if (subtaskModalTask == null) {
      return;
    }

    setActionTaskId(subtaskModalTask.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      const subtasks = [
        ...subtaskModalTask.subtasks.map((subtask) => ({
          title: subtask.title,
          note: subtask.note,
          status: subtask.status,
          completedAt: subtask.completedAt
        })),
        ...payload.map((subtask) => ({
          title: subtask.title,
          status: subtask.status,
          completedAt: subtask.status === 'completed' ? new Date().toISOString() : null
        }))
      ];

      await updateTask(subtaskModalTask.id, {
        status: deriveTaskStatusFromSubtasks(subtaskModalTask.status, subtasks),
        subtasks
      });
      await loadDashboard();
      setSubtaskModalTask(null);
      setTaskMutationSuccess(payload.length === 1 ? 'Sub-task created.' : 'Sub-tasks created.');
    } catch {
      setTaskMutationError('Unable to create the subtask.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleDeleteSubtask = async (
    task: Task,
    targetSubtask: Task['subtasks'][number]
  ): Promise<void> => {
    if (!requestConfirmation(`Remove sub-task "${targetSubtask.title}" from "${task.title}"?`)) {
      return;
    }

    setActionTaskId(task.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      const subtasks = task.subtasks
        .filter((subtask) => subtask.id !== targetSubtask.id)
        .map((subtask) => ({
          title: subtask.title,
          note: subtask.note,
          status: subtask.status,
          completedAt: subtask.completedAt
        }));

      await updateTask(task.id, {
        status: deriveTaskStatusFromSubtasks(task.status, subtasks),
        subtasks
      });
      await loadDashboard();
      setTaskMutationSuccess('Sub-task removed.');
    } catch {
      setTaskMutationError('Unable to remove the sub-task.');
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

  const handleOpenCreateNote = (): void => {
    if (activeProject == null) {
      return;
    }

    setNoteMutationError(null);
    setNoteMutationSuccess(null);
    setActiveNoteEditor({
      kind: 'project',
      note: null,
      projectId: activeProject.id,
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

    if (
      (editor.kind === 'project' && editor.note != null) ||
      (editor.kind === 'task' && editor.task.note?.trim()) ||
      (editor.kind === 'subtask' && editor.subtask.note?.trim())
    ) {
      const label =
        editor.kind === 'project'
          ? `project note "${editor.note?.title ?? ''}"`
          : editor.kind === 'task'
            ? `task note for "${editor.task.title}"`
            : `sub-task note for "${editor.subtask.title}"`;
      const actionLabel = payload.appendContent ? 'append to' : 'update';

      if (!requestConfirmation(`Confirm ${actionLabel} ${label}?`)) {
        return;
      }
    }

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

        await updateTask(latestTask.id, {
          status: deriveTaskStatusFromSubtasks(latestTask.status, subtasks),
          subtasks
        });
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
    if (!requestConfirmation(`Delete note "${note.title}"?`)) {
      return;
    }

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

  const handleDeleteInlineNote = async (): Promise<void> => {
    if (activeNoteEditor == null || activeNoteEditor.kind === 'project') {
      return;
    }

    if (
      !requestConfirmation(
        activeNoteEditor.kind === 'task'
          ? `Delete task note for "${activeNoteEditor.task.title}"?`
          : `Delete sub-task note for "${activeNoteEditor.subtask.title}"?`
      )
    ) {
      return;
    }

    setActionNoteId(
      activeNoteEditor.kind === 'task'
        ? activeNoteEditor.task.id
        : `${activeNoteEditor.task.id}:${activeNoteEditor.subtask.id}`
    );
    setNoteMutationError(null);
    setNoteMutationSuccess(null);

    try {
      if (activeNoteEditor.kind === 'task') {
        await updateTask(activeNoteEditor.task.id, { note: '' });
        setTaskMutationSuccess('Task note deleted.');
      } else {
        const latestTask = tasks.find((task) => task.id === activeNoteEditor.task.id) ?? activeNoteEditor.task;
        const subtasks = latestTask.subtasks.map((subtask) => ({
          title: subtask.title,
          note: subtask.id === activeNoteEditor.subtask.id ? '' : subtask.note,
          status: subtask.status,
          completedAt: subtask.completedAt
        }));

        await updateTask(latestTask.id, {
          status: deriveTaskStatusFromSubtasks(latestTask.status, subtasks),
          subtasks
        });
        setTaskMutationSuccess('Sub-task note deleted.');
      }

      await loadDashboard();
      setActiveNoteEditor(null);
    } catch {
      setNoteMutationError('Unable to delete the note.');
    } finally {
      setActionNoteId(null);
    }
  };

  const handleOpenTaskNote = (task: Task): void => {
    setNoteMutationError(null);
    setNoteMutationSuccess(null);
    setActiveNoteEditor({
      kind: 'task',
      task: tasks.find((currentTask) => currentTask.id === task.id) ?? task
    });
  };

  const handleOpenSubtaskNote = (task: Task, subtask: Task['subtasks'][number]): void => {
    setNoteMutationError(null);
    setNoteMutationSuccess(null);
    setActiveNoteEditor({
      kind: 'subtask',
      task: tasks.find((currentTask) => currentTask.id === task.id) ?? task,
      subtask:
        (tasks.find((currentTask) => currentTask.id === task.id)?.subtasks.find((currentSubtask) => currentSubtask.id === subtask.id) ??
          subtask)
    });
  };

  const tasksByProject = useMemo(() => {
    const counts = new Map<string | null, number>();

    tasks.forEach((task) => {
      const key = task.projectId ?? null;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return counts;
  }, [tasks]);
  const activeProject = useMemo(() => {
    if (selectedProjectView === ALL_PROJECTS_VALUE) {
      return null;
    }

    return projects.find((project) => project.id === selectedProjectView) ?? null;
  }, [projects, selectedProjectView]);
  const visibleTasks = useMemo(() => {
    if (selectedProjectView === ALL_PROJECTS_VALUE) {
      return tasks;
    }

    return tasks.filter((task) => task.projectId === selectedProjectView);
  }, [selectedProjectView, tasks]);
  const tasksHeading = useMemo(() => {
    if (selectedProjectView === ALL_PROJECTS_VALUE) {
      return `All tasks for ${selectedDate}`;
    }

    return `${activeProject?.name ?? 'Project'} tasks for ${selectedDate}`;
  }, [activeProject?.name, selectedDate, selectedProjectView]);
  const activeProjectEpics = useMemo(
    () =>
      activeProject == null
        ? []
        : epics
            .filter((epic) => epic.projectId === activeProject.id)
            .sort((left, right) => left.order - right.order),
    [activeProject, epics]
  );
  const activeProjectNotes = activeProject ? projectNotes[activeProject.id] ?? [] : [];
  const activeProjectNotesModalTitle = activeProject ? `Notes for ${activeProject.name}` : 'Project Notes';

  return (
    <main className="stack">
      <Navbar />
      <SectionCard className="hero-card dashboard-shell">
        <div className="dashboard-hero-simple">
          <PageHeader
            title="Dashboard"
            description="Select a project, review tasks for the day, and manage work from one clean workspace."
          />
          <DateNavigator date={selectedDate} disabled={loading} onChange={setSelectedDate} />
        </div>
      </SectionCard>
      <SectionCard className="workspace-card workspace-card-full">
        <div className="card-header workspace-header">
          <div className="workspace-header-copy">
            <span className="eyebrow">Task Surface</span>
            <h2>{tasksHeading}</h2>
            <p className="muted-text">Project-filtered execution list for the selected date.</p>
          </div>
          <div className="workspace-header-actions">
            <label className="workspace-project-switcher">
              <span>Project</span>
              <select onChange={(event) => setSelectedProjectView(event.target.value)} value={selectedProjectView}>
                <option value={ALL_PROJECTS_VALUE}>All projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            {activeProject ? (
              <button
                className="secondary-button"
                onClick={() => setIsEpicManagerOpen(true)}
                type="button"
              >
                Manage epics
              </button>
            ) : null}
            {activeProject ? (
              <button
                className="secondary-button"
                onClick={() => {
                  if (projectNotes[activeProject.id] == null) {
                    void loadNotesForProject(activeProject.id);
                  }
                  setIsProjectNotesModalOpen(true);
                }}
                type="button"
              >
                Project notes
              </button>
            ) : null}
            <button className="secondary-button" onClick={() => setIsProjectManagerOpen(true)} type="button">
              Manage projects
            </button>
            <button
              onClick={() => {
                setTaskModalProjectId(selectedProjectView === ALL_PROJECTS_VALUE ? null : selectedProjectView);
                setIsTaskCreateModalOpen(true);
              }}
              type="button"
            >
              New task
            </button>
          </div>
        </div>
        
          {projectMutationSuccess ? <p className="success-text">{projectMutationSuccess}</p> : null}
          {projectMutationError ? <p className="error-text">{projectMutationError}</p> : null}
          {epicMutationSuccess ? <p className="success-text">{epicMutationSuccess}</p> : null}
          {epicMutationError ? <p className="error-text">{epicMutationError}</p> : null}
          {taskMutationSuccess ? <p className="success-text">{taskMutationSuccess}</p> : null}
          {taskMutationError ? <p className="error-text">{taskMutationError}</p> : null}
          {noteMutationSuccess ? <p className="success-text">{noteMutationSuccess}</p> : null}
          {noteMutationError ? <p className="error-text">{noteMutationError}</p> : null}
          {loading ? <p className="muted-text">Refreshing tasks for {selectedDate}...</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        
        {!loading && visibleTasks.length === 0 ? (
          <EmptyState
            description="Use the project selector or create a new task to populate this date."
            icon={ClipboardList}
            title="No tasks in this view"
          />
        ) : null}
        {!loading && visibleTasks.length > 0 ? (
          <TaskList
            actionTaskId={actionTaskId}
            epics={epics}
            onDeleteSubtask={(task, subtask) => void handleDeleteSubtask(task, subtask)}
            onCreateSubtask={(task) => setSubtaskModalTask(task)}
            onDelete={(taskId) => void handleDeleteTask(taskId)}
            onOpenSubtaskNote={(task, subtask) => handleOpenSubtaskNote(task, subtask)}
            onOpenTaskNote={(task) => handleOpenTaskNote(task)}
            onUpdateEpic={(task, epicId) => void handleUpdateTaskEpic(task, epicId)}
            onUpdateStatus={(task, status) => void handleUpdateTaskStatus(task, status)}
            onUpdateSubtaskStatus={(task, subtask, status) => void handleUpdateSubtaskStatus(task, subtask, status)}
            projects={projects}
            tasks={visibleTasks}
          />
        ) : null}
      </SectionCard>
      {isProjectCreateModalOpen ? (
        <Modal onClose={() => setIsProjectCreateModalOpen(false)} title="Create Project">
          <ProjectForm onSubmit={handleCreateProject} />
        </Modal>
      ) : null}
      {editingProject ? (
        <Modal onClose={() => setEditingProject(null)} title="Update Project">
          <ProjectForm initialName={editingProject.name} onSubmit={handleUpdateProject} submitLabel="Update project" />
        </Modal>
      ) : null}
      {isProjectManagerOpen ? (
        <Modal
          bodyClassName="project-manager-modal-body"
          onClose={() => setIsProjectManagerOpen(false)}
          panelClassName="project-manager-modal-panel"
          title="Manage Projects"
        >
          <ProjectPanel
            actionProjectId={actionProjectId}
            loading={loading}
            onOpenCreateProject={() => setIsProjectCreateModalOpen(true)}
            onOpenEpicManager={(project) => {
              setSelectedProjectView(project.id);
              setEditingEpic(null);
              setIsEpicCreateModalOpen(false);
              setIsProjectManagerOpen(false);
              setIsEpicManagerOpen(true);
            }}
            onOpenProject={(projectId) => {
              setSelectedProjectView(projectId ?? ALL_PROJECTS_VALUE);
              setIsProjectManagerOpen(false);
            }}
            onOpenUpdateProject={(project) => {
              setEditingProject(project);
            }}
            onDeleteProject={handleDeleteProject}
            projects={projects}
            tasksByProject={tasksByProject}
          />
        </Modal>
      ) : null}
      {isEpicManagerOpen && activeProject ? (
        <Modal onClose={() => setIsEpicManagerOpen(false)} title={`Manage Epics for ${activeProject.name}`}>
          <EpicManager
            actionEpicId={actionEpicId}
            epics={activeProjectEpics}
            onCreateEpic={() => setIsEpicCreateModalOpen(true)}
            onDeleteEpic={handleDeleteEpic}
            onEditEpic={(epic) => setEditingEpic(epic)}
            onMoveEpic={handleMoveEpic}
            projectName={activeProject.name}
          />
        </Modal>
      ) : null}
      {isEpicCreateModalOpen && activeProject ? (
        <Modal onClose={() => setIsEpicCreateModalOpen(false)} title={`Create Epic for ${activeProject.name}`}>
          <EpicForm onSubmit={handleCreateEpic} submitLabel="Create epic" />
        </Modal>
      ) : null}
      {editingEpic && activeProject ? (
        <Modal onClose={() => setEditingEpic(null)} title={`Update Epic for ${activeProject.name}`}>
          <EpicForm
            initialDescription={editingEpic.description}
            initialName={editingEpic.name}
            initialStatus={editingEpic.status}
            onSubmit={handleUpdateEpic}
            submitLabel="Update epic"
          />
        </Modal>
      ) : null}
      {isTaskCreateModalOpen ? (
        <Modal onClose={() => setIsTaskCreateModalOpen(false)} title="Create Task">
          <AddTaskForm epics={epics} initialProjectId={taskModalProjectId} onCreateTask={handleCreateTask} projects={projects} />
        </Modal>
      ) : null}
      {isProjectNotesModalOpen && activeProject ? (
        <Modal onClose={() => setIsProjectNotesModalOpen(false)} title={activeProjectNotesModalTitle}>
          <ProjectNotes
            actionNoteId={actionNoteId}
            loading={notesLoadingProjectId === activeProject.id}
            notes={activeProjectNotes}
            onCreateNote={handleOpenCreateNote}
            onDeleteNote={(note) => void handleDeleteNote(note)}
            onOpenNote={(note) => void handleOpenExistingNote(note)}
          />
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
          allowDelete={
            activeNoteEditor.kind === 'project'
              ? activeNoteEditor.note != null
              : activeNoteEditor.kind === 'task'
                ? Boolean(activeNoteEditor.task.note?.trim())
                : Boolean(activeNoteEditor.subtask.note?.trim())
          }
          deleteLabel={
            activeNoteEditor.kind === 'project'
              ? 'Delete Note'
              : activeNoteEditor.kind === 'task'
                ? 'Delete Task Note'
                : 'Delete Sub-task Note'
          }
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
                  ? 'Edit Task Note'
                  : 'Create Task Note'
                : activeNoteEditor.subtask.note?.trim()
                  ? 'Edit Sub-task Note'
                  : 'Create Sub-task Note'
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
          onDelete={
            activeNoteEditor.kind === 'project'
              ? activeNoteEditor.note
                ? () => void handleDeleteNote(activeNoteEditor.note as Note)
                : undefined
              : () => void handleDeleteInlineNote()
          }
          onSave={handleSaveNote}
          showTitle={activeNoteEditor.kind === 'project'}
          titlePlaceholder="Sprint recap"
        />
      ) : null}
    </main>
  );
}

export default DashboardPage;
