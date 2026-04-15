import { useCallback, useEffect, useMemo, useState } from 'react';

import AddTaskForm from '@/components/AddTaskForm';
import DateNavigator from '@/components/DateNavigator';
import EditTaskForm from '@/components/EditTaskForm';
import EmptyState from '@/components/EmptyState';
import EpicForm from '@/components/EpicForm';
import EpicManager from '@/components/EpicManager';
import Modal from '@/components/Modal';
import SubtaskInlineEdit from '@/components/SubtaskInlineEdit';
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
import SourceBadge from '@/components/SourceBadge';
import { Calendar, CheckCircle, ChevronDown, Folder, Layout, List, LogOut, MessageSquare, Plus, Settings } from 'lucide-react';
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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<{ task: Task; subtask: Task['subtasks'][number] } | null>(null);
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

  const handleUpdateTask = async (payload: {
    title: string;
    description?: string;
    date: string;
    status: TaskWorkflowStatus;
    projectId: string | null;
    epicId: string | null;
  }): Promise<void> => {
    if (editingTask == null) return;

    setActionTaskId(editingTask.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      // Preserve existing subtasks
      await updateTask(editingTask.id, {
        title: payload.title,
        description: payload.description,
        date: payload.date,
        status: payload.status,
        projectId: payload.projectId,
        epicId: payload.epicId,
      });
      await loadDashboard();
      setTaskMutationSuccess('Task updated.');
      setEditingTask(null);
    } catch {
      setTaskMutationError('Unable to update the task.');
      throw new Error('Unable to update task');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleUpdateSubtask = async (
    task: Task,
    targetSubtask: Task['subtasks'][number],
    patch: { title: string; description?: string }
  ): Promise<void> => {
    setActionTaskId(task.id);
    setTaskMutationError(null);
    setTaskMutationSuccess(null);

    try {
      const subtasks = task.subtasks.map((subtask) => (
        subtask.id === targetSubtask.id
          ? { title: patch.title.trim(), note: subtask.note, status: subtask.status, completedAt: subtask.completedAt }
          : { title: subtask.title, note: subtask.note, status: subtask.status, completedAt: subtask.completedAt }
      ));

      await updateTask(task.id, { status: task.status as TaskWorkflowStatus, subtasks });
      await loadDashboard();
      setTaskMutationSuccess('Subtask updated.');
      setEditingSubtask(null);
    } catch {
      setTaskMutationError('Unable to update the subtask.');
    } finally {
      setActionTaskId(null);
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

  const sideNavItem = 'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[0.9rem] font-medium text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all duration-200';
  const sideNavItemActive = 'bg-white/16 text-white';

  const statusPillCls: Record<string, string> = {
    planned: 'bg-blue-500/20 text-blue-300',
    active: 'bg-amber-500/20 text-amber-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
    archived: 'bg-zinc-500/20 text-zinc-400',
  };

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 dark:bg-[#0b1220]">
      {/* Sidebar */}
      <aside className="flex flex-col w-[240px] shrink-0 bg-zinc-900 dark:bg-[#0c1525] border-r border-white/8 h-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4.5 border-b border-white/8">
          <Layout className="text-blue-400" size={22} />
          <span className="font-['Outfit'] font-bold text-white text-[1.1rem] tracking-tight">Task Manager</span>
        </div>

        {/* Project nav */}
        <div className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
          <p className="text-[0.65rem] uppercase tracking-[0.1em] text-slate-500 font-bold px-3 pt-2 pb-1">Workspace</p>
          <button
            className={`${sideNavItem} ${selectedProjectView === ALL_PROJECTS_VALUE ? sideNavItemActive : ''}`}
            onClick={() => handleProjectSelect(ALL_PROJECTS_VALUE)}
            type="button"
          >
            <Folder size={16} />
            <span>All Projects</span>
          </button>

          <button
            className={`${sideNavItem} text-blue-400 hover:text-blue-200 hover:bg-blue-600/15`}
            onClick={() => setIsProjectCreateModalOpen(true)}
            type="button"
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-1 p-3 border-t border-white/8">
          <button
            className={`${sideNavItem} ${activeView === 'settings' ? sideNavItemActive : ''}`}
            onClick={() => setActiveView('settings')}
            title="Settings"
            type="button"
          >
            <Settings size={16} />
            <span>Settings</span>
          </button>
          <button className={sideNavItem} onClick={logout} title="Sign out" type="button">
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Right side wrapper */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 px-6 h-14 shrink-0 bg-white/92 dark:bg-slate-900/92 border-b border-zinc-200 dark:border-slate-700 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold">
              {user?.email?.[0].toUpperCase()}
            </div>
            <span className="text-zinc-600 dark:text-slate-400 text-sm">{user?.email}</span>
          </div>

          <div className="flex items-center gap-3">
            <DateNavigator date={selectedDate} disabled={loading} onChange={setSelectedDate} />
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-hidden">
          {activeView === 'settings' ? (
            <div className="h-full overflow-y-auto">
              <div className="px-8 py-6 border-b border-zinc-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60">
                <h3 className="text-xl font-semibold text-zinc-900 dark:text-slate-100 m-0">Settings</h3>
                <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm mt-0.5">Account &amp; Preferences</p>
              </div>
              <div className="p-8">
                <SettingsPanel />
              </div>
            </div>
          ) : !activeProject ? (
            <div className="h-full overflow-y-auto">
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
            /* 3-column workspace */
            <div className="flex flex-col h-full overflow-hidden bg-zinc-50 dark:bg-slate-900/40">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-slate-700 bg-white/40 dark:bg-slate-900/40 shrink-0">
                <div className="flex items-center gap-3">
                  <Folder className="text-blue-500 shrink-0" size={20} />
                  <div className="relative flex items-center">
                    <select
                      className="appearance-none bg-transparent border-none text-lg font-bold text-zinc-900 dark:text-slate-100 focus:outline-none focus:ring-0 cursor-pointer pr-6 m-0 p-0"
                      onChange={(e) => handleProjectSelect(e.target.value)}
                      value={activeProject.id}
                    >
                      {projects.map((project) => (
                        <option
                          className="text-zinc-900 dark:text-slate-100 bg-white dark:bg-slate-800 text-base font-normal"
                          key={project.id}
                          value={project.id}
                        >
                          {project.name}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                      <ChevronDown className="text-zinc-500 dark:text-slate-400" size={16} />
                    </div>
                  </div>
                </div>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm font-medium text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
                  onClick={() => handleOpenProjectNotesPanel(activeProject)}
                  type="button"
                >
                  <MessageSquare size={16} />
                  Project Notes
                </button>
              </div>
              <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-zinc-200 dark:divide-slate-700">
                {/* Column 1 — Epics */}
                <div className="flex flex-col w-1/4 shrink-0 h-full">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 m-0">Epics</h3>
                      <p className="text-zinc-400 dark:text-slate-500 text-[0.75rem] m-0">{activeProject.name}</p>
                    </div>
                    <button
                      className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                      onClick={() => setIsEpicCreateModalOpen(true)}
                      type="button"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 grid gap-2 content-start">
                    {activeProjectEpics.map(epic => (
                      <button
                        key={epic.id}
                        className={[
                          'w-full text-start rounded-xl border px-4 py-3 flex flex-col gap-1.5 transition-all',
                          selectedEpicId === epic.id
                            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-sm'
                            : 'bg-white dark:bg-slate-800/60 border-zinc-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                        ].join(' ')}
                        onClick={() => setSelectedEpicId(epic.id === selectedEpicId ? null : epic.id)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-2 w-full">
                          <h4 className="text-zinc-900 dark:text-slate-100 text-sm font-semibold m-0 truncate">{epic.name}</h4>
                          <span className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded uppercase ${statusPillCls[epic.status] ?? statusPillCls.planned}`}>
                            {epic.status}
                          </span>
                        </div>
                        {epic.description && (
                          <p className="text-zinc-400 dark:text-slate-500 text-[0.78rem] m-0 line-clamp-2 w-full">{epic.description}</p>
                        )}
                        <div className="flex items-start gap-2 mt-1 w-full">
                          <button
                            className="text-[0.75rem] text-zinc-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleOpenEpicNotesPanel(epic); }}
                            type="button"
                          >
                            Notes
                          </button>
                          <button
                            className="text-[0.75rem] text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-200 transition-colors"
                            onClick={(e) => { e.stopPropagation(); setEditingEpic(epic); }}
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

                {/* Column 2 — Tasks */}
                {selectedEpicId && (
                  <div className="flex flex-col w-1/3 shrink-0 h-full">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 m-0">Tasks</h3>
                        <p className="text-zinc-400 dark:text-slate-500 text-[0.75rem] m-0">{epics.find(e => e.id === selectedEpicId)?.name}</p>
                      </div>
                      <button
                        className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                        onClick={() => {
                          setTaskModalProjectId(activeProject?.id ?? null);
                          setIsTaskCreateModalOpen(true);
                        }}
                        type="button"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 grid gap-2 content-start">
                      <TaskList
                        actionTaskId={actionTaskId}
                        epics={epics}
                        onDeleteSubtask={(task, subtask) => void handleDeleteSubtask(task, subtask)}
                        onCreateSubtask={(task) => setSubtaskModalTask(task)}
                        onDelete={(taskId) => void handleDeleteTask(taskId)}
                        onEditTask={(task) => setEditingTask(task)}
                        onEditSubtask={(task, subtask) => setEditingSubtask({ task, subtask })}
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

                {/* Column 3 — Subtasks */}
                {selectedTaskId && activeTask && (
                  <div className="flex flex-col flex-1 min-w-0 h-full">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-slate-100 m-0">Subtasks</h3>
                        <p className="text-zinc-400 dark:text-slate-500 text-[0.75rem] m-0 truncate max-w-[220px]">{activeTask.title}</p>
                      </div>
                      <button
                        className="flex items-center justify-center w-7 h-7 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
                        onClick={() => setSubtaskModalTask(activeTask)}
                        type="button"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid gap-3 content-start">
                      {activeTask.subtasks.map(subtask => {
                        const isEditingThisSubtask = editingSubtask?.task.id === activeTask.id && editingSubtask?.subtask.id === subtask.id;
                        return (
                          <div key={subtask.id} className="bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl px-4 py-3 grid gap-1.5">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <input
                                  checked={subtask.status === 'completed'}
                                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                                  onChange={() => void handleUpdateSubtaskStatus(activeTask, subtask, subtask.status === 'completed' ? 'pending' : 'completed')}
                                  type="checkbox"
                                />
                                <span className={subtask.status === 'completed' ? 'text-zinc-400 dark:text-slate-500 line-through text-sm' : 'text-zinc-800 dark:text-slate-200 text-sm'}>
                                  {subtask.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  className="text-zinc-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 text-xs transition-colors"
                                  onClick={() => setEditingSubtask(isEditingThisSubtask ? null : { task: activeTask, subtask })}
                                  type="button"
                                >
                                  {isEditingThisSubtask ? 'Cancel' : 'Edit'}
                                </button>
                                <button
                                  className="text-zinc-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                  onClick={() => handleOpenSubtaskNote(activeTask, subtask)}
                                  type="button"
                                >
                                  <MessageSquare size={14} />
                                </button>
                                <button
                                  className="text-zinc-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors"
                                  onClick={() => void handleDeleteSubtask(activeTask, subtask)}
                                  type="button"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                            {/* Inline subtask edit form */}
                            {isEditingThisSubtask && (
                              <SubtaskInlineEdit
                                subtask={subtask}
                                onSave={(patch) => void handleUpdateSubtask(activeTask, subtask, patch)}
                                onCancel={() => setEditingSubtask(null)}
                                isSaving={actionTaskId === activeTask.id}
                              />
                            )}
                            {!isEditingThisSubtask && subtask.description && (
                              <p className="text-zinc-400 dark:text-slate-500 text-xs italic pl-7 m-0">{subtask.description}</p>
                            )}
                            {!isEditingThisSubtask && subtask.note && (
                              <p className="text-zinc-500 dark:text-slate-400 text-xs pl-7 m-0">{subtask.note}</p>
                            )}
                          </div>
                        );
                      })}
                      {activeTask.subtasks.length === 0 && (
                        <EmptyState description="Break down your task into smaller steps." icon={CheckCircle} title="All clear" />
                      )}

                      {/* Task detail footer */}
                      <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-slate-700">
                        <h4 className="text-sm font-bold text-zinc-700 dark:text-slate-300 m-0 mb-3">Task Detail</h4>
                        {activeTask.description && <p className="text-zinc-500 dark:text-slate-400 text-sm mb-3">{activeTask.description}</p>}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-[0.7rem] font-bold px-2 py-0.5 rounded border ${statusPillCls[activeTask.status] ?? statusPillCls.planned}`}>
                            {activeTask.status.replace('_', ' ')}
                          </span>
                          <SourceBadge source={activeTask.source} />
                        </div>
                        <button
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 text-sm hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
                          onClick={() => handleOpenTaskNote(activeTask)}
                          type="button"
                        >
                          <MessageSquare size={14} /> Task Note
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

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
      {editingTask ? (
        <Modal onClose={() => setEditingTask(null)} title={`Edit Task: ${editingTask.title}`}>
          <EditTaskForm
            epics={epics}
            onSubmit={handleUpdateTask}
            projects={projects}
            task={editingTask}
          />
        </Modal>
      ) : null}
      {subtaskModalTask ? (
        <Modal
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
