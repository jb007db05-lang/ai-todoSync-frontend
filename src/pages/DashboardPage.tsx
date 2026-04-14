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
import SettingsPanel from '@/components/SettingsPanel';
import SubtaskForm from '@/components/SubtaskForm';
import TaskList from '@/components/TaskList';
import { Calendar, CheckCircle, Folder, Layout, List, LogOut, MessageSquare, Plus, Settings } from 'lucide-react';
import { createEpic, deleteEpic, getEpics, reorderEpics, updateEpic } from '@/services/epics';
import { createEpicNote, createNote, deleteNote, getEpicNotes, getNote, getProjectNotes, updateNote } from '@/services/notes';
import { createProject, deleteProject, deleteProjects, getProjects, updateProject } from '@/services/projects';
import { createTask, deleteTask, getTasks, updateTask } from '@/services/tasks';
import { useAuth } from '@/context/AuthContext';
import { NavLink } from 'react-router-dom';
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
      kind: 'epic';
      epicId: string;
      epicName: string;
      note: Note | null;
      projectId: string;
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
  const [isEpicNotesModalOpen, setIsEpicNotesModalOpen] = useState(false);
  const [isTaskCreateModalOpen, setIsTaskCreateModalOpen] = useState(false);
  const [selectedProjectView, setSelectedProjectView] = useState<string>(ALL_PROJECTS_VALUE);
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskModalProjectId, setTaskModalProjectId] = useState<string | null>(null);
  const [subtaskModalTask, setSubtaskModalTask] = useState<Task | null>(null);
  const [projectNotes, setProjectNotes] = useState<Record<string, Note[]>>({});
  const [epicNotes, setEpicNotes] = useState<Record<string, Note[]>>({});
  const [notesLoadingKey, setNotesLoadingKey] = useState<string | null>(null);
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotalPages, setProjectTotalPages] = useState<number>(1);
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const [activeView, setActiveView] = useState<'dashboard' | 'settings'>('dashboard');
  const [activeProjectForNotes, setActiveProjectForNotes] = useState<Project | null>(null);
  const [activeEpicForNotes, setActiveEpicForNotes] = useState<Epic | null>(null);
  const [activeNoteEditor, setActiveNoteEditor] = useState<ActiveNoteEditor | null>(null);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const [taskList, projectData] = await Promise.all([
        getTasks(selectedDate),
        getProjects({ page: projectPage, limit: 10, search: projectSearchTerm })
      ]);
      const projectList = projectData.projects;
      const epicGroups = await Promise.all(projectList.map((project: Project) => getEpics(project.id)));
      setTasks(taskList);
      setProjects(projectList);
      setEpics(epicGroups.flat());
      setProjectTotalPages(projectData.totalPages);
    } catch {
      setError('Unable to load tasks for the selected day.');
      setTasks([]);
      setProjects([]);
      setEpics([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, projectPage, projectSearchTerm]);

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
      setEpicNotes((current) => {
        const next = { ...current };
        delete next[epic.id];
        return next;
      });

      if (editingEpic?.id === epic.id) {
        setEditingEpic(null);
      }

      if (activeEpicForNotes?.id === epic.id) {
        setActiveEpicForNotes(null);
        setIsEpicNotesModalOpen(false);
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

  const handleCreateProject = async (payload: { name: string; description?: string }): Promise<void> => {
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

  const handleUpdateProject = async (payload: { name: string; description?: string }): Promise<void> => {
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
    if (!requestConfirmation('Are you sure you want to delete this project? All associated tasks, epics, and notes will be permanently removed.')) {
      return;
    }

    setActionProjectId(projectId);
    try {
      await deleteProject(projectId);
      await loadDashboard();
      setProjectNotes((current) => {
        const next = { ...current };
        delete next[projectId];
        return next;
      });
      setEpicNotes((current) => {
        const next = { ...current };
        Object.keys(next).forEach((epicId) => {
          if (epics.find((epic) => epic.id === epicId)?.projectId === projectId) {
            delete next[epicId];
          }
        });
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

        if (current.kind === 'epic') {
          return current.projectId === projectId ? null : current;
        }

        return current.task.projectId === projectId ? null : current;
      });
      setSubtaskModalTask((current) => (current?.projectId === projectId ? null : current));
      setEditingEpic((current) => (current?.projectId === projectId ? null : current));

      if (activeProject?.id === projectId) {
        setIsEpicManagerOpen(false);
        setIsEpicCreateModalOpen(false);
        setIsProjectNotesModalOpen(false);
      }

      if (activeProjectForNotes?.id === projectId) {
        setActiveProjectForNotes(null);
        setIsProjectNotesModalOpen(false);
      }

      if (activeEpicForNotes?.projectId === projectId) {
        setActiveEpicForNotes(null);
        setIsEpicNotesModalOpen(false);
      }

      setProjectMutationSuccess('Project deleted. Related tasks and notes were removed.');
    } catch {
      setProjectMutationError('Unable to delete the project.');
    } finally {
      setActionProjectId(null);
    }
  };

  const handleDeleteProjects = async (projectIds: string[]): Promise<void> => {
    if (!requestConfirmation(`Are you sure you want to delete ${projectIds.length} projects? All associated tasks, epics, and notes will be permanently removed.`)) {
      return;
    }

    setActionProjectId('bulk');
    try {
      await deleteProjects(projectIds);
      await loadDashboard();
      if (selectedProjectView && projectIds.includes(selectedProjectView)) {
        handleProjectSelect(ALL_PROJECTS_VALUE);
      }
    } catch {
      // Error handled by UI
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
    setNotesLoadingKey(`project:${projectId}`);

    try {
      const notes = await getProjectNotes(projectId);
      setProjectNotes((current) => ({
        ...current,
        [projectId]: notes
      }));
    } catch {
      setNoteMutationError('Unable to load notes for this project.');
    } finally {
      setNotesLoadingKey((current) => (current === `project:${projectId}` ? null : current));
    }
  }, []);

  const loadNotesForEpic = useCallback(async (projectId: string, epicId: string): Promise<void> => {
    setNotesLoadingKey(`epic:${epicId}`);

    try {
      const notes = await getEpicNotes(projectId, epicId);
      setEpicNotes((current) => ({
        ...current,
        [epicId]: notes
      }));
    } catch {
      setNoteMutationError('Unable to load notes for this epic.');
    } finally {
      setNotesLoadingKey((current) => (current === `epic:${epicId}` ? null : current));
    }
  }, []);

  const handleOpenCreateProjectNote = (project: Project): void => {
    setNoteMutationError(null);
    setNoteMutationSuccess(null);
    setActiveNoteEditor({
      kind: 'project',
      note: null,
      projectId: project.id,
      projectName: project.name
    });
  };

  const handleOpenCreateEpicNote = (epic: Epic): void => {
    setNoteMutationError(null);
    setNoteMutationSuccess(null);
    setActiveNoteEditor({
      kind: 'epic',
      epicId: epic.id,
      epicName: epic.name,
      note: null,
      projectId: epic.projectId
    });
  };

  const handleOpenExistingNote = async (note: Note): Promise<void> => {
    setActionNoteId(note.id);
    setNoteMutationError(null);
    setNoteMutationSuccess(null);

    try {
      const latestNote = await getNote(note.id);
      if (latestNote.entityType === 'epic') {
        const epicName = epics.find((epic) => epic.id === latestNote.epicId)?.name ?? activeEpicForNotes?.name ?? 'Epic';
        setActiveNoteEditor({
          kind: 'epic',
          epicId: latestNote.epicId ?? '',
          epicName,
          note: latestNote,
          projectId: latestNote.projectId
        });
      } else {
        const projectName =
          projects.find((project) => project.id === latestNote.projectId)?.name ?? activeProject?.name ?? 'Project';
        setActiveNoteEditor({
          kind: 'project',
          note: latestNote,
          projectId: latestNote.projectId,
          projectName
        });
      }
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
      (editor.kind === 'epic' && editor.note != null) ||
      (editor.kind === 'task' && editor.task.note?.trim()) ||
      (editor.kind === 'subtask' && editor.subtask.note?.trim())
    ) {
      const label =
        editor.kind === 'project'
          ? `project note "${editor.note?.title ?? ''}"`
          : editor.kind === 'epic'
            ? `epic note "${editor.note?.title ?? ''}"`
          : editor.kind === 'task'
            ? `task note for "${editor.task.title}"`
            : `sub-task note for "${editor.subtask.title}"`;
      const actionLabel = payload.appendContent ? 'append to' : 'update';

      if (!requestConfirmation(`Confirm ${actionLabel} ${label}?`)) {
        return;
      }
    }

    setActionNoteId(editor.kind === 'project' || editor.kind === 'epic' ? editor.note?.id ?? 'new' : null);
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
      } else if (editor.kind === 'epic') {
        if (editor.note) {
          const updated = await updateNote(editor.note.id, {
            appendContent: payload.appendContent,
            title: payload.title,
            content: payload.content
          });
          setEpicNotes((current) => ({
            ...current,
            [editor.epicId]: (current[editor.epicId] ?? []).map((note) => (note.id === updated.id ? updated : note))
          }));
          setNoteMutationSuccess(payload.appendContent ? 'Content appended to note.' : 'Note updated.');
        } else {
          const created = await createEpicNote(editor.projectId, editor.epicId, {
            title: payload.title ?? '',
            content: payload.content
          });
          setEpicNotes((current) => ({
            ...current,
            [editor.epicId]: [created, ...(current[editor.epicId] ?? [])]
          }));
          setNoteMutationSuccess('Epic note created.');
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
      if (note.entityType === 'epic' && note.epicId) {
        setEpicNotes((current) => ({
          ...current,
          [note.epicId as string]: (current[note.epicId as string] ?? []).filter((currentNote) => currentNote.id !== note.id)
        }));
      } else {
        setProjectNotes((current) => ({
          ...current,
          [note.projectId]: (current[note.projectId] ?? []).filter((currentNote) => currentNote.id !== note.id)
        }));
      }

      if ((activeNoteEditor?.kind === 'project' || activeNoteEditor?.kind === 'epic') && activeNoteEditor.note?.id === note.id) {
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
    if (activeNoteEditor == null || activeNoteEditor.kind === 'project' || activeNoteEditor.kind === 'epic') {
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

  const handleOpenProjectNotesPanel = (project: Project): void => {
    if (projectNotes[project.id] == null) {
      void loadNotesForProject(project.id);
    }

    setActiveProjectForNotes(project);
    setActiveEpicForNotes(null);
    setIsProjectNotesModalOpen(true);
  };

  const handleOpenEpicNotesPanel = (epic: Epic): void => {
    if (epicNotes[epic.id] == null) {
      void loadNotesForEpic(epic.projectId, epic.id);
    }

    setActiveEpicForNotes(epic);
    setIsEpicNotesModalOpen(true);
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
  const activeProjectNotes = activeProjectForNotes ? projectNotes[activeProjectForNotes.id] ?? [] : [];
  const activeEpicNotes = activeEpicForNotes ? epicNotes[activeEpicForNotes.id] ?? [] : [];
  const activeProjectNotesModalTitle = activeProjectForNotes ? `Notes for ${activeProjectForNotes.name}` : 'Project Notes';
  const activeEpicNotesModalTitle = activeEpicForNotes ? `Notes for ${activeEpicForNotes.name}` : 'Epic Notes';

  const { user, logout } = useAuth();

  const handleProjectSelect = (projectId: string): void => {
    setActiveView('dashboard');
    setSelectedProjectView(projectId);
    setSelectedEpicId(null);
    setSelectedTaskId(null);
  };

  const handleProjectPageChange = (page: number): void => {
    setProjectPage(page);
  };

  const handleProjectSearch = (term: string): void => {
    setProjectSearchTerm(term);
    setProjectPage(1);
  };

  const handleEpicSelect = (epicId: string): void => {
    setSelectedEpicId(epicId);
    setSelectedTaskId(null);
  };

  const activeEpicTasks = useMemo(() => {
    if (!selectedEpicId) return [];
    return visibleTasks.filter(t => t.epicId === selectedEpicId);
  }, [selectedEpicId, visibleTasks]);

  const activeTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasks]);

  return (
    <div className="dashboard-root">
      {/* Sidebar - Projects */}
      <aside className="sidebar-nav">
        <div className="sidebar-logo">
          <Layout className="accent-blue" size={24} />
          <span className="logo-text">TodoSync</span>
        </div>
        <div className="sidebar-projects">
          <p className="eyebrow">Workspace</p>
          <button
            className={`project-nav-item ${selectedProjectView === ALL_PROJECTS_VALUE ? 'project-nav-item-active' : ''}`}
            onClick={() => handleProjectSelect(ALL_PROJECTS_VALUE)}
            type="button"
          >
            <Folder size={18} />
            <span>All Projects</span>
          </button>
          
          <button
            className="project-nav-item project-nav-item-new"
            onClick={() => setIsProjectCreateModalOpen(true)}
            type="button"
          >
            <Plus size={18} />
            <span>New Project</span>
          </button>
        </div>
        
        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--card-border)' }}>
          <button 
            className={`project-nav-item ${activeView === 'settings' ? 'project-nav-item-active' : ''}`}
            onClick={() => setActiveView('settings')}
            title="Settings"
            type="button"
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
          <button className="project-nav-item" onClick={logout} title="Sign out" type="button">
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Top Bar - User & Global Actions */}
      <header className="top-bar-nav">
        <div className="top-bar-user">
          <div className="user-avatar">
            {user?.email?.[0].toUpperCase()}
          </div>
          <span className="user-email">{user?.email}</span>
        </div>
        
        <div className="top-bar-actions">
          <DateNavigator date={selectedDate} disabled={loading} onChange={setSelectedDate} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {activeView === 'settings' ? (
          <div className="full-width-pane">
            <div className="pane-header">
              <div className="pane-header-content">
                <h3 className="pane-header-title">Settings</h3>
                <p className="pane-header-subtitle">Account & Preferences</p>
              </div>
            </div>
            <div className="pane-content">
              <SettingsPanel />
            </div>
          </div>
        ) : !activeProject ? (
          <div className="full-width-pane">
            <ProjectPanel
              actionProjectId={actionProjectId}
              currentPage={projectPage}
              loading={loading}
              onDeleteProject={handleDeleteProject}
              onDeleteProjects={handleDeleteProjects}
              onOpenCreateProject={() => setIsProjectCreateModalOpen(true)}
              onOpenEpicManager={(project) => {
                handleProjectSelect(project.id);
              }}
              onOpenProject={(projectId) => {
                handleProjectSelect(projectId ?? ALL_PROJECTS_VALUE);
              }}
              onOpenUpdateProject={(project) => {
                setEditingProject(project);
              }}
              projects={projects}
              tasksByProject={tasksByProject}
              totalPages={projectTotalPages}
              onPageChange={handleProjectPageChange}
              onSearch={handleProjectSearch}
              searchTerm={projectSearchTerm}
            />
          </div>
        ) : (
          <div className="workspace-columns">
            {/* Column 1: Epics */}
            <div className="pane-column">
              <div className="pane-header">
                <div className="pane-header-content">
                  <h3 className="pane-header-title">Epics</h3>
                  <p className="pane-header-subtitle">{activeProject.name}</p>
                </div>
                <button className="subtask-add-button primary-button" onClick={() => setIsEpicCreateModalOpen(true)} type="button">
                  <Plus size={16} />
                </button>
              </div>
              <div className="pane-content">
                <div className="stack">
                  {activeProjectEpics.map(epic => (
                    <button
                      key={epic.id}
                      className={`selectable-card ${selectedEpicId === epic.id ? 'selectable-card-active' : ''}`}
                      onClick={() => setSelectedEpicId(epic.id === selectedEpicId ? null : epic.id)}
                      type="button"
                    >
                      <div className="card-title-row">
                        <h4>{epic.name}</h4>
                        <span className={`status-pill status-${epic.status.toLowerCase()}`}>
                          {epic.status}
                        </span>
                      </div>
                      {epic.description && (
                        <p className="card-description">{epic.description}</p>
                      )}
                      <div className="card-actions-row-compact">
                        <button
                          className="ghost-button"
                          onClick={(e) => { e.stopPropagation(); handleOpenEpicNotesPanel(epic); }}
                          style={{ padding: '0', fontSize: '0.75rem' }}
                          type="button"
                        >
                          <MessageSquare size={14} style={{ marginRight: 4 }} /> Notes
                        </button>
                        <button
                          className="ghost-button"
                          onClick={(e) => { e.stopPropagation(); setEditingEpic(epic); }}
                          style={{ padding: '0', fontSize: '0.75rem' }}
                          type="button"
                        >
                          Edit
                        </button>
                      </div>
                    </button>
                  ))}
                  {activeProjectEpics.length === 0 && (
                    <EmptyState description="Create an epic to group your tasks." icon={List} title="No epics found" />
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Tasks */}
            {selectedEpicId && (
              <div className="pane-column">
                <div className="pane-header">
                  <div className="pane-header-content">
                    <h3 className="pane-header-title">Tasks</h3>
                    <p className="pane-header-subtitle">{epics.find(e => e.id === selectedEpicId)?.name}</p>
                  </div>
                  <button
                    className="subtask-add-button primary-button"
                  onClick={() => {
                    setTaskModalProjectId(activeProject?.id ?? null);
                    setIsTaskCreateModalOpen(true);
                  }}
                  type="button"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="pane-content">
                <TaskList
                  actionTaskId={actionTaskId}
                  epics={epics}
                  onDeleteSubtask={(task, subtask) => void handleDeleteSubtask(task, subtask)}
                  onCreateSubtask={(task) => setSubtaskModalTask(task)}
                  onDelete={(taskId) => void handleDeleteTask(taskId)}
                  onOpenEpicNotes={(epic) => handleOpenEpicNotesPanel(epic)}
                  onOpenProjectNotes={(project) => handleOpenProjectNotesPanel(project)}
                  onOpenSubtaskNote={(task, subtask) => handleOpenSubtaskNote(task, subtask)}
                  onOpenTaskNote={(task) => handleOpenTaskNote(task)}
                  onUpdateEpic={(task, epicId) => void handleUpdateTaskEpic(task, epicId)}
                  onUpdateStatus={(task, status) => void handleUpdateTaskStatus(task, status)}
                  onUpdateSubtaskStatus={(task, subtask, status) => void handleUpdateSubtaskStatus(task, subtask, status)}
                  projects={projects}
                  tasks={activeEpicTasks}
                  onSelectTask={(task) => setSelectedTaskId(task.id)}
                  selectedTaskId={selectedTaskId}
                />
                {activeEpicTasks.length === 0 && (
                  <EmptyState description="No tasks scheduled for this epic today." icon={Calendar} title="Empty workspace" />
                )}
              </div>
            </div>
          )}

          {/* Column 3: Subtasks */}
          {selectedTaskId && activeTask && (
            <div className="pane-column">
              <div className="pane-header">
                <div className="pane-header-content">
                  <h3 className="pane-header-title">Subtasks</h3>
                  <p className="pane-header-subtitle">{activeTask.title}</p>
                </div>
                <button
                  className="subtask-add-button primary-button"
                  onClick={() => setSubtaskModalTask(activeTask)}
                  type="button"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="pane-content">
                <div className="stack" style={{ gap: '12px' }}>
                  {activeTask.subtasks.map(subtask => (
                    <div key={subtask.id} className="task-card" style={{ padding: '12px' }}>
                      <div className="subtask-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <input
                            checked={subtask.status === 'completed'}
                            className="custom-checkbox"
                            onChange={() => void handleUpdateSubtaskStatus(activeTask, subtask, subtask.status === 'completed' ? 'pending' : 'completed')}
                            type="checkbox"
                          />
                          <span className={subtask.status === 'completed' ? 'subtask-title-done' : 'subtask-title'}>
                            {subtask.title}
                          </span>
                        </div>
                        <div className="card-actions-row-compact" style={{ marginTop: 0 }}>
                          <button
                            className="ghost-button"
                            onClick={() => handleOpenSubtaskNote(activeTask, subtask)}
                            style={{ padding: '0' }}
                            type="button"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            className="ghost-button danger-text"
                            onClick={() => void handleDeleteSubtask(activeTask, subtask)}
                            style={{ padding: '0', fontSize: '0.75rem' }}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {subtask.description && (
                         <p className="card-description" style={{ marginTop: 4, paddingLeft: 28, fontStyle: 'italic', fontSize: '0.8rem' }}>
                           {subtask.description}
                         </p>
                      )}
                      {subtask.note && (
                        <p className="card-description" style={{ marginTop: 8, paddingLeft: 28 }}>
                          {subtask.note}
                        </p>
                      )}
                    </div>
                  ))}
                  {activeTask.subtasks.length === 0 && (
                    <EmptyState description="Break down your task into smaller steps." icon={CheckCircle} title="All clear" />
                  )}
                  
                  <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                    <div className="pane-header-content" style={{ marginBottom: 16 }}>
                      <h4 className="pane-header-title" style={{ fontSize: '0.9rem' }}>Task Detail</h4>
                    </div>
                    {activeTask.description && <p className="card-description" style={{ marginBottom: 16 }}>{activeTask.description}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span className={`status-pill status-${activeTask.status}`}>{activeTask.status.replace('_', ' ')}</span>
                      <span className="source-badge">{activeTask.source}</span>
                    </div>
                    <div className="card-actions-row">
                      <button className="secondary-button" onClick={() => handleOpenTaskNote(activeTask)} style={{ flex: 1 }} type="button">
                        <MessageSquare size={16} /> Task Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
       )}
      </main>

      {/* Modals & Overlays */}
      {isProjectCreateModalOpen ? (
        <Modal onClose={() => setIsProjectCreateModalOpen(false)} title="Create Project">
          <ProjectForm onSubmit={handleCreateProject} />
        </Modal>
      ) : null}
      {editingProject ? (
        <Modal onClose={() => setEditingProject(null)} title="Update Project">
          <ProjectForm initialDescription={editingProject.description} initialName={editingProject.name} onSubmit={handleUpdateProject} submitLabel="Update project" />
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
      {isProjectNotesModalOpen && activeProjectForNotes ? (
        <Modal onClose={() => setIsProjectNotesModalOpen(false)} title={activeProjectNotesModalTitle}>
          <ProjectNotes
            actionNoteId={actionNoteId}
            heading="Project notes"
            loading={activeProjectForNotes != null && notesLoadingKey === `project:${activeProjectForNotes.id}`}
            notes={activeProjectNotes}
            onCreateNote={() => activeProjectForNotes && handleOpenCreateProjectNote(activeProjectForNotes)}
            onDeleteNote={(note) => void handleDeleteNote(note)}
            onOpenNote={(note) => void handleOpenExistingNote(note)}
          />
        </Modal>
      ) : null}
      {isEpicNotesModalOpen && activeEpicForNotes ? (
        <Modal onClose={() => setIsEpicNotesModalOpen(false)} title={activeEpicNotesModalTitle}>
          <ProjectNotes
            actionNoteId={actionNoteId}
            createLabel="Create epic note"
            emptyDescription="Create the first note to capture decisions, references, or follow-ups for this epic."
            emptyTitle="No epic notes yet"
            heading="Epic notes"
            loading={notesLoadingKey === `epic:${activeEpicForNotes.id}`}
            notes={activeEpicNotes}
            onCreateNote={() => handleOpenCreateEpicNote(activeEpicForNotes)}
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
          allowAppend={(activeNoteEditor.kind === 'project' || activeNoteEditor.kind === 'epic') && activeNoteEditor.note != null}
          allowDelete={
            activeNoteEditor.kind === 'project' || activeNoteEditor.kind === 'epic'
              ? activeNoteEditor.note != null
              : activeNoteEditor.kind === 'task'
                ? Boolean(activeNoteEditor.task.note?.trim())
                : Boolean(activeNoteEditor.subtask.note?.trim())
          }
          deleteLabel={
            activeNoteEditor.kind === 'project'
              ? 'Delete Note'
              : activeNoteEditor.kind === 'epic'
                ? 'Delete Epic Note'
              : activeNoteEditor.kind === 'task'
                ? 'Delete Task Note'
                : 'Delete Sub-task Note'
          }
          entityLabel={
            activeNoteEditor.kind === 'project'
              ? activeNoteEditor.projectName
              : activeNoteEditor.kind === 'epic'
                ? activeNoteEditor.epicName
              : activeNoteEditor.kind === 'task'
                ? activeNoteEditor.task.title
                : `${activeNoteEditor.task.title} / ${activeNoteEditor.subtask.title}`
          }
          modalTitle={
            activeNoteEditor.kind === 'project'
              ? activeNoteEditor.note
                ? 'Edit Project Note'
                : 'Create Project Note'
              : activeNoteEditor.kind === 'epic'
                ? activeNoteEditor.note
                  ? 'Edit Epic Note'
                  : 'Create Epic Note'
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
              : activeNoteEditor.kind === 'epic'
                ? activeNoteEditor.note
              : activeNoteEditor.kind === 'task'
                ? { title: '', content: activeNoteEditor.task.note ?? '' }
                : { title: '', content: activeNoteEditor.subtask.note ?? '' }
          }
          onClose={() => {
            setActiveNoteEditor(null);
          }}
          onDelete={
            activeNoteEditor.kind === 'project' || activeNoteEditor.kind === 'epic'
              ? activeNoteEditor.note
                ? () => void handleDeleteNote(activeNoteEditor.note as Note)
                : undefined
              : () => void handleDeleteInlineNote()
          }
          onSave={handleSaveNote}
          showTitle={activeNoteEditor.kind === 'project' || activeNoteEditor.kind === 'epic'}
          titlePlaceholder="Sprint recap"
        />
      ) : null}
    </div>
  );
}

export default DashboardPage;
