import { useCallback, useEffect, useMemo, useState, useRef } from 'react';

import AddTaskForm from '@/components/AddTaskForm';
import DateNavigator from '@/components/DateNavigator';
import EditTaskForm from '@/components/EditTaskForm';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import EpicForm from '@/components/EpicForm';
import SubtaskInlineEdit from '@/components/SubtaskInlineEdit';
import NoteModal from '@/components/NoteModal';
import ProjectForm from '@/components/ProjectForm';
import ProjectNotes from '@/components/ProjectNotes';
import ProjectPanel from '@/components/ProjectPanel';
import ProjectTeamPanel from '@/components/ProjectTeamPanel';
import SettingsPanel from '@/components/SettingsPanel';
import SubtaskForm from '@/components/SubtaskForm';
import ChatPanel from '@/components/ChatPanel';
import { useChat } from '@/context/ChatContext';
import NotificationBox, { Notification } from '@/components/NotificationBox';
import TaskList from '@/components/TaskList';
import TaskFilterBar, { TaskFilters } from '@/components/TaskFilterBar';
import SourceBadge from '@/components/SourceBadge';
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  FileText,
  Folder,
  Layout,
  List,
  LogOut,
  Bell,
  MessageCircle,
  MessageSquare,
  NotebookPen,
  Plus,
  Settings,
  Users,
  Trash2
} from 'lucide-react';
import { createEpic, deleteEpic, getEpics, reorderEpics, updateEpic } from '@/services/epics';
import { createEpicNote, createNote, deleteNote, getEpicNotes, getNote, getProjectNotes, updateNote } from '@/services/notes';
import {
  addProjectMember,
  createProject,
  deleteProject,
  deleteProjects,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  updateProject
} from '@/services/projects';
import { assignTask, createTask, deleteTask, getTasks, updateTask } from '@/services/tasks';
import { searchUsersByEmail } from '@/services/users';
import { useAuth } from '@/context/AuthContext';
import type { Epic, EpicStatus } from '@/types/epic';
import type { Note } from '@/types/note';
import type { Project, ProjectMember, UserSearchResult } from '@/types/project';
import type { Task, TaskWorkflowStatus } from '@/types/task';
import { findProjectByName } from '@/utils/projectTree';
import { useConfirm } from '@/context/ConfirmationContext';

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
  const { user, logout } = useAuth();
  const confirm = useConfirm();
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

  // Auto-dismiss success notifications
  useEffect(() => {
    if (taskMutationSuccess) {
      const timer = setTimeout(() => {
        setTaskMutationSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [taskMutationSuccess]);
  const [projectMutationError, setProjectMutationError] = useState<string | null>(null);
  const [projectMutationSuccess, setProjectMutationSuccess] = useState<string | null>(null);
  const [epicMutationError, setEpicMutationError] = useState<string | null>(null);
  const [epicMutationSuccess, setEpicMutationSuccess] = useState<string | null>(null);
  const [noteMutationError, setNoteMutationError] = useState<string | null>(null);
  const [noteMutationSuccess, setNoteMutationSuccess] = useState<string | null>(null);
  const [isProjectCreateModalOpen, setIsProjectCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEpicCreateModalOpen, setIsEpicCreateModalOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);

  const [taskFilters, setTaskFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    assigneeId: 'all',
    epicId: 'all',
    source: 'all'
  });

  const handleClearFilters = () => {
    setTaskFilters({
      search: '',
      status: 'all',
      assigneeId: 'all',
      epicId: 'all',
      source: 'all'
    });
  };
  const [isProjectNotesModalOpen, setIsProjectNotesModalOpen] = useState(false);
  const [isEpicNotesModalOpen, setIsEpicNotesModalOpen] = useState(false);
  const [isTaskCreateModalOpen, setIsTaskCreateModalOpen] = useState(false);
  const [isProjectTeamModalOpen, setIsProjectTeamModalOpen] = useState(false);
  const [selectedProjectView, setSelectedProjectView] = useState<string>(ALL_PROJECTS_VALUE);
  const [selectedEpicId, setSelectedEpicId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskModalProjectId, setTaskModalProjectId] = useState<string | null>(null);
  const [subtaskModalTask, setSubtaskModalTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<{ task: Task; subtask: Task['subtasks'][number] } | null>(null);
  const [projectNotes, setProjectNotes] = useState<Record<string, Note[]>>({});
  const [epicNotes, setEpicNotes] = useState<Record<string, Note[]>>({});
  const [projectMembersByProject, setProjectMembersByProject] = useState<Record<string, ProjectMember[]>>({});
  const [notesLoadingKey, setNotesLoadingKey] = useState<string | null>(null);
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotalPages, setProjectTotalPages] = useState<number>(1);
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const [memberSearchTerm, setMemberSearchTerm] = useState<string>('');
  const [memberSearchResults, setMemberSearchResults] = useState<UserSearchResult[]>([]);
  const [teamMutationLoading, setTeamMutationLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'settings'>('dashboard');
  const [activeProjectForNotes, setActiveProjectForNotes] = useState<Project | null>(null);
  const [activeEpicForNotes, setActiveEpicForNotes] = useState<Epic | null>(null);
  const [activeNoteEditor, setActiveNoteEditor] = useState<ActiveNoteEditor | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const { lastMessage, clearLastMessage, setActiveProject } = useChat();


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

  const loadProjectTeam = useCallback(async (projectId: string): Promise<void> => {
    try {
      const members = await getProjectMembers(projectId);
      setProjectMembersByProject((current) => ({
        ...current,
        [projectId]: members
      }));
    } catch {
      setProjectMutationError('Unable to load the project team.');
    }
  }, []);

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
    assignedToUserId: string | null;
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
      if (editingTask.assignedToUserId !== payload.assignedToUserId) {
        await assignTask(editingTask.id, payload.assignedToUserId);
      }
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

  const handleDeleteEpic = async (epicId: string) => {
    const epic = epics.find((e) => e.id === epicId);
    if (!epic) return;

    const isConfirmed = await confirm({
      title: 'Delete Epic',
      message: `Delete epic "${epic.name}"? Tasks will remain and move to "No Epic".`,
      confirmText: 'Delete Epic',
      type: 'danger'
    });

    if (!isConfirmed) return;

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

  const handleProjectMemberSearch = async (term: string): Promise<void> => {
    setMemberSearchTerm(term);

    if (term.trim().length < 2) {
      setMemberSearchResults([]);
      return;
    }

    try {
      const results = await searchUsersByEmail(term.trim());
      setMemberSearchResults(results);
    } catch {
      setMemberSearchResults([]);
    }
  };

  const handleAddProjectMember = async (userId: string): Promise<void> => {
    if (activeProject == null) {
      return;
    }

    setTeamMutationLoading(true);
    setProjectMutationError(null);
    setProjectMutationSuccess(null);

    try {
      await addProjectMember(activeProject.id, userId);
      await Promise.all([loadDashboard(), loadProjectTeam(activeProject.id)]);
      setMemberSearchResults([]);
      setMemberSearchTerm('');
      setProjectMutationSuccess('Project member added.');
    } catch {
      setProjectMutationError('Unable to add the project member.');
    } finally {
      setTeamMutationLoading(false);
    }
  };

  const handleRemoveProjectMember = async (userId: string): Promise<void> => {
    if (activeProject == null) {
      return;
    }

    const member = (projectMembersByProject[activeProject.id] ?? []).find((entry) => entry.userId === userId);

    if (member?.role === 'ADMIN') {
      setProjectMutationError('Project admins cannot be removed from the team.');
      setProjectMutationSuccess(null);
      return;
    }

    const label = member?.user.name || member?.user.email || 'this member';
    const isConfirmed = await confirm({
      title: 'Remove Project Member',
      message: `Remove ${label} from ${activeProject.name}? Assigned tasks will be unassigned.`,
      confirmText: 'Remove Member',
      type: 'danger'
    });

    if (!isConfirmed) {
      return;
    }

    setTeamMutationLoading(true);
    setProjectMutationError(null);
    setProjectMutationSuccess(null);

    try {
      await removeProjectMember(activeProject.id, userId);
      await Promise.all([loadDashboard(), loadProjectTeam(activeProject.id)]);
      setProjectMutationSuccess('Project member removed.');

      if (userId === user?.id) {
        handleProjectSelect(ALL_PROJECTS_VALUE);
      }
    } catch {
      setProjectMutationError('Unable to remove the project member.');
    } finally {
      setTeamMutationLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? All associated tasks, epics, and notes will be permanently removed.',
      confirmText: 'Delete Project',
      type: 'danger'
    });

    if (!isConfirmed) return;

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

  const handleDeleteProjects = async (projectIds: string[]) => {
    const isConfirmed = await confirm({
      title: 'Delete Multiple Projects',
      message: `Are you sure you want to delete ${projectIds.length} projects? All associated tasks, epics, and notes will be permanently removed.`,
      confirmText: 'Delete Projects',
      type: 'danger'
    });

    if (!isConfirmed) return;

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

  const handleUpdateTaskStatus = async (task: Task, status: TaskWorkflowStatus) => {
    const isConfirmed = await confirm({
      title: 'Update Task Status',
      message: `Update the status for "${task.title}" to "${status.replace('_', ' ')}"?`,
      confirmText: 'Update Status',
      type: 'info'
    });

    if (!isConfirmed) return;

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

  const handleDeleteTask = async (taskId: string, taskTitle: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Task',
      message: `Delete "${taskTitle}"?`,
      confirmText: 'Delete Task',
      type: 'danger'
    });

    if (!isConfirmed) return;

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
    const isConfirmed = await confirm({
      title: 'Update Subtask Status',
      message: `Update the status for sub-task "${targetSubtask.title}" in "${task.title}" to "${status.replace('_', ' ')}"?`,
      confirmText: 'Update Status',
      type: 'info'
    });

    if (!isConfirmed) return;

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

  const handleDeleteSubtask = async (task: Task, subtaskId: string) => {
    const targetSubtask = task.subtasks.find((s) => s.id === subtaskId);
    if (!targetSubtask) return;

    const isConfirmed = await confirm({
      title: 'Delete Subtask',
      message: `Remove sub-task "${targetSubtask.title}" from "${task.title}"?`,
      confirmText: 'Delete Subtask',
      type: 'danger'
    });

    if (!isConfirmed) return;

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
      const isDestructive = false;

      const isConfirmed = await confirm({
        title: `${actionLabel} ${label}`,
        message: `Confirm ${actionLabel} ${label}?`,
        confirmText: actionLabel,
        type: isDestructive ? 'danger' : 'info'
      });

      if (!isConfirmed) return;
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

  const handleDeleteNote = async (note: Note) => {
    const isConfirmed = await confirm({
      title: 'Delete Note',
      message: `Delete note "${note.title}"?`,
      confirmText: 'Delete Note',
      type: 'danger'
    });

    if (!isConfirmed) return;

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

    const label = activeNoteEditor.kind === 'task'
      ? `task note for "${activeNoteEditor.task.title}"`
      : `sub-task note for "${activeNoteEditor.subtask.title}"`;

    const isConfirmed = await confirm({
      title: 'Delete Note',
      message: `Delete ${label}?`,
      confirmText: 'Delete Note',
      type: 'danger'
    });

    if (!isConfirmed) return;

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

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevProjectsRef = useRef<Project[]>([]);

  // Track project list changes for 'Added to Team' notifications
  useEffect(() => {
    if (projects.length > 0 && prevProjectsRef.current.length > 0) {
      const newProjects = projects.filter(p => !prevProjectsRef.current.find(prev => prev.id === p.id));
      newProjects.forEach(project => {
        const notification: Notification = {
          id: `team-${project.id}-${Date.now()}`,
          type: 'team_join',
          title: 'Added to Team',
          message: `You were added to the project "${project.name}"`,
          timestamp: new Date(),
          isRead: false,
          projectId: project.id,
        };
        setNotifications(prev => [notification, ...prev]);
      });
    }
    prevProjectsRef.current = projects;
  }, [projects]);

  // Convert lastMessage to notification
  useEffect(() => {
    if (lastMessage && !isChatPanelOpen) {
      if (lastMessage.sender?.id === user?.id || lastMessage.senderId === user?.id) return;

      const newNotification: Notification = {
        id: lastMessage.id,
        type: 'message',
        title: `Message from ${lastMessage.sender?.name || lastMessage.sender?.email}`,
        message: lastMessage.content,
        timestamp: new Date(lastMessage.createdAt),
        isRead: false,
        projectId: activeProject?.id,
      };
      
      setNotifications((prev: Notification[]) => {
        // Avoid duplicates if lastMessage is re-emitted
        if (prev.some(n => n.id === lastMessage.id)) return prev;
        return [newNotification, ...prev];
      });
    }
  }, [lastMessage, isChatPanelOpen, activeProject, user?.id]);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    if (notification.type === 'message') {
      setIsChatPanelOpen(true);
    }
    setIsNotificationsOpen(false);
  };
  const activeProjectMembers = activeProject ? (projectMembersByProject[activeProject.id] ?? []) : [];
  const canManageActiveProject = activeProject?.currentUserRole === 'ADMIN';
  const visibleTasks = useMemo(() => {
    let filtered = tasks;
    
    // Project filter
    if (selectedProjectView !== ALL_PROJECTS_VALUE) {
      filtered = filtered.filter((task) => task.projectId === selectedProjectView);
    }

    // Status filter
    if (taskFilters.status !== 'all') {
      filtered = filtered.filter((task) => task.status === taskFilters.status);
    }

    // Assignee filter
    if (taskFilters.assigneeId !== 'all') {
      filtered = filtered.filter((task) => task.assignedToUserId === taskFilters.assigneeId);
    }

    // Epic filter
    if (taskFilters.epicId !== 'all') {
      filtered = filtered.filter((task) => task.epicId === taskFilters.epicId);
    }

    // Source filter
    if (taskFilters.source !== 'all') {
      filtered = filtered.filter((task) => task.source === taskFilters.source);
    }

    // Search filter
    if (taskFilters.search.trim()) {
      const term = taskFilters.search.toLowerCase();
      filtered = filtered.filter((task) => 
        task.title.toLowerCase().includes(term) || 
        task.description?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [selectedProjectView, tasks, taskFilters]);
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

  useEffect(() => {
    if (activeProject == null) {
      setMemberSearchResults([]);
      setMemberSearchTerm('');
      setActiveProject(null);
      return;
    }

    setActiveProject(activeProject);

    if (projectMembersByProject[activeProject.id] == null) {
      void loadProjectTeam(activeProject.id);
    }
  }, [activeProject, loadProjectTeam, projectMembersByProject, setActiveProject]);

  useEffect(() => {
    if (editingTask?.projectId && projectMembersByProject[editingTask.projectId] == null) {
      void loadProjectTeam(editingTask.projectId);
    }
  }, [editingTask, loadProjectTeam, projectMembersByProject]);

  useEffect(() => {
    if (lastMessage && !isChatPanelOpen) {
      // Notification is handled by the dedicated useEffect above
      // setTaskMutationSuccess(...) is removed in favor of the notification bell
      clearLastMessage();
    }
  }, [lastMessage, isChatPanelOpen, clearLastMessage]);

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out of your account?',
      confirmText: 'LOGOUT',
      type: 'danger'
    });

    if (isConfirmed) {
      logout();
    }
  };

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

  const handleEpicSelect = (epicId: string | null): void => {
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

  // const sideNavItem = 'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[0.9rem] font-medium text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-all duration-200 justify-start';
  // const sideNavItemActive = 'bg-olive-700 text-white font-bold shadow-sm';

  const statusPillCls: Record<string, string> = {
    planned: 'bg-blue-500/20 text-blue-300',
    active: 'bg-amber-500/20 text-amber-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
    archived: 'bg-zinc-500/20 text-zinc-400',
  };

  const allMutationMessages = [
    taskMutationError,
    taskMutationSuccess,
    projectMutationError,
    projectMutationSuccess,
    epicMutationError,
    epicMutationSuccess,
    noteMutationError,
    noteMutationSuccess,
    error
  ].filter(Boolean);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-100 dark:bg-[#0b1220]">
      {/* Toast Notification */}
      {allMutationMessages.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
          {allMutationMessages.map((msg, i) => (
            <div
              key={i}
              className={`px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-4 ${msg?.toLowerCase().includes('unable') || msg?.toLowerCase().includes('error')
                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{msg}</span>
                <button
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  onClick={() => {
                    // Clear all for now to keep it simple, or specific ones if needed
                    setTaskMutationError(null);
                    setTaskMutationSuccess(null);
                    setProjectMutationError(null);
                    setProjectMutationSuccess(null);
                    setEpicMutationError(null);
                    setEpicMutationSuccess(null);
                    setNoteMutationError(null);
                    setNoteMutationSuccess(null);
                    setError(null);
                  }}
                >
                  <Plus className="rotate-45" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Sidebar */}
      <aside className="flex flex-col w-[260px] shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-zinc-200 dark:border-slate-800 h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-[72px] border-b border-zinc-200 dark:border-slate-800 shrink-0">
          <Layout className="text-olive-600 dark:text-olive-500" size={24} strokeWidth={2.5} />
          <span className="font-['Outfit'] font-extrabold text-olive-950 dark:text-white text-[1.25rem] tracking-tight">Task Manager</span>
        </div>

        {/* Project nav */}
        <div className="flex flex-col gap-1.5 p-4 flex-1 overflow-y-auto">
          <p className="text-[0.7rem] uppercase tracking-widest text-zinc-400 dark:text-slate-500 font-bold px-3 pt-2 pb-2">Workspace</p>
          <button
            className={[
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
              selectedProjectView === ALL_PROJECTS_VALUE && activeView !== 'settings'
                ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20' 
                : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            ].join(' ')}
            onClick={() => handleProjectSelect(ALL_PROJECTS_VALUE)}
            type="button"
          >
            <Folder size={18} strokeWidth={2} />
            <span>All Projects</span>
          </button>

          <button
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-olive-600 hover:text-olive-700 hover:bg-olive-50 dark:text-olive-500 dark:hover:bg-olive-900/40 transition-all duration-200 justify-start mt-1 border border-dashed border-olive-200 dark:border-olive-800"
            onClick={() => setIsProjectCreateModalOpen(true)}
            type="button"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Project</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-1 p-4 border-t border-zinc-200 dark:border-slate-800 shrink-0">
          <button
            className={[
              'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium transition-all duration-200 justify-start',
              activeView === 'settings' 
                ? 'bg-olive-700 text-white shadow-md shadow-olive-700/20' 
                : 'text-zinc-600 hover:text-olive-950 hover:bg-zinc-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
            ].join(' ')}
            onClick={() => setActiveView('settings')}
            title="Settings"
            type="button"
          >
            <Settings size={18} strokeWidth={2} />
            <span>Settings</span>
          </button>
          <button 
             className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-[0.95rem] font-medium text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200 justify-start mt-1"
             onClick={handleLogout} 
             title="Sign out" 
             type="button"
          >
            <LogOut size={18} strokeWidth={2} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Right side wrapper */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        {/* Top bar (Redesigned Header matching Image) */}
        <header className="relative z-50 flex items-center justify-between gap-4 px-8 h-[72px] shrink-0 bg-white dark:bg-slate-900 border-b border-zinc-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col justify-center">
            <h1 className="text-[1.15rem] font-bold text-olive-950 dark:text-white leading-tight">
              {activeView === 'settings' ? 'Settings' : (activeProject ? activeProject.name : 'All Projects')}
            </h1>
            <div className="flex items-center text-[0.75rem] font-semibold text-zinc-400 dark:text-slate-500 mt-0.5 gap-1.5">
              <button 
                onClick={() => { setActiveView('dashboard'); handleProjectSelect(ALL_PROJECTS_VALUE); }}
                className="hover:text-olive-600 dark:hover:text-olive-400 transition-colors"
                type="button"
              >
                Dashboard
              </button>
              
              <span className="text-zinc-300 dark:text-slate-600">/</span>

              {activeView === 'settings' ? (
                <span className="text-zinc-600 dark:text-slate-300">Settings</span>
              ) : activeProject ? (
                <>
                  <button 
                    onClick={() => { setActiveView('dashboard'); handleProjectSelect(ALL_PROJECTS_VALUE); }}
                    className="hover:text-olive-600 dark:hover:text-olive-400 transition-colors"
                    type="button"
                  >
                    Projects
                  </button>
                  <span className="text-zinc-300 dark:text-slate-600">/</span>
                  <span className="text-zinc-600 dark:text-slate-300">{activeProject.name}</span>
                </>
              ) : (
                <span className="text-zinc-600 dark:text-slate-300">All Projects</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5">
            {activeView !== 'settings' && (
              <div className="mr-2">
                <DateNavigator date={selectedDate} disabled={loading} onChange={setSelectedDate} />
              </div>
            )}

            {/* Chat Trigger */}
            <button
              onClick={() => setIsChatPanelOpen(true)}
              className="relative flex items-center justify-center p-2 rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open chat"
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                className="relative flex items-center justify-center p-2 rounded-full text-zinc-600 hover:bg-zinc-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                title="Notifications"
                type="button"
              >
                <Bell className="w-5 h-5" />
                {notifications.some(n => !n.isRead) && (
                  <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-olive-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <NotificationBox
                  notifications={notifications}
                  onClose={() => setIsNotificationsOpen(false)}
                  onMarkAsRead={handleMarkAsRead}
                  onClearAll={handleClearAll}
                  onNotificationClick={handleNotificationClick}
                />
              )}
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-3 pl-5 border-l border-zinc-200 dark:border-slate-800">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-olive-100 dark:bg-olive-800/50 text-olive-700 dark:text-olive-300 text-sm font-bold shadow-sm border border-olive-200/50 dark:border-olive-700/50">
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-[0.8rem] font-bold text-olive-900 dark:text-slate-200 leading-tight">
                  {user?.name || 'Current User'}
                </span>
                <span className="text-[0.7rem] text-zinc-500 dark:text-slate-400 font-medium">
                  {user?.email}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 overflow-hidden">
          {activeView === 'settings' ? (
            <div className="h-full overflow-y-auto">
              <div className="px-8 py-6 border-b border-zinc-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60">
                <h3 className="text-xl font-semibold text-olive-950 dark:text-slate-100 m-0">Settings</h3>
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
            <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 dark:bg-white dark:bg-slate-900">
              <div className="shrink-0 px-6 py-5 border-b border-zinc-200/80 dark:border-slate-700/80 bg-white/78 dark:bg-slate-950/38 ">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-500/25 shrink-0">
                      <Folder size={20} />
                    </div>
                    <div className="grid gap-1">
                      <div className="relative flex items-center">
                        <select
                          className="appearance-none bg-transparent border-none text-[1.35rem] font-bold text-olive-950 dark:text-slate-100 focus:outline-none focus:ring-0 cursor-pointer pr-6 m-0 p-0 tracking-tight"
                          onChange={(e) => handleProjectSelect(e.target.value)}
                          value={activeProject.id}
                        >
                          {projects.map((project) => (
                            <option
                              className="text-olive-950 dark:text-slate-100 bg-white dark:bg-slate-800 text-base font-normal"
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
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm font-medium text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
                      onClick={() => handleOpenProjectNotesPanel(activeProject)}
                      type="button"
                    >
                      <MessageSquare size={16} />
                      Project Notes
                    </button>
                    <button
                      className={[
                        'flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-bold shadow-sm transition-all duration-300 transform active:scale-95',
                        isChatPanelOpen
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-600 text-white shadow-blue-500/25'
                          : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-600 text-zinc-600 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400'
                      ].join(' ')}
                      onClick={() => setIsChatPanelOpen(!isChatPanelOpen)}
                      type="button"
                    >
                      <MessageCircle size={18} className={isChatPanelOpen ? 'text-white' : 'text-blue-500'} />
                      Chat
                    </button>
                    <button
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-lg text-sm font-medium text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-700 shadow-sm transition-colors"
                      onClick={() => setIsProjectTeamModalOpen(true)}
                      type="button"
                    >
                      <Users size={16} />
                      Team
                    </button>
                  </div>
                </div>
                {/* <div className="flex flex-wrap items-center gap-3 mt-4">
                  <div className="px-3.5 py-2 rounded-lg bg-white/82 dark:bg-slate-900/65 border border-zinc-200/80 dark:border-slate-700/80 shadow-sm">
                    <div className="text-[0.66rem] uppercase tracking-[0.14em] font-bold text-zinc-500 dark:text-slate-400">Epics</div>
                    <div className="text-[1rem] font-bold text-olive-950 dark:text-slate-100">{activeProjectEpics.length}</div>
                  </div>
                  <div className="px-3.5 py-2 rounded-lg bg-white/82 dark:bg-slate-900/65 border border-zinc-200/80 dark:border-slate-700/80 shadow-sm">
                    <div className="text-[0.66rem] uppercase tracking-[0.14em] font-bold text-zinc-500 dark:text-slate-400">Visible Tasks</div>
                    <div className="text-[1rem] font-bold text-olive-950 dark:text-slate-100">{visibleTasks.length}</div>
                  </div>
                  <div className="px-3.5 py-2 rounded-lg bg-white/82 dark:bg-slate-900/65 border border-zinc-200/80 dark:border-slate-700/80 shadow-sm">
                    <div className="text-[0.66rem] uppercase tracking-[0.14em] font-bold text-zinc-500 dark:text-slate-400">Role</div>
                    <div className="text-[1rem] font-bold text-olive-950 dark:text-slate-100">{activeProject.currentUserRole}</div>
                  </div>
                </div> */}
              </div>
              <div className="flex flex-1 min-h-0 overflow-hidden gap-4 p-4 md:p-5">
                {/* Column 1 — Epics */}
                <div className="flex flex-col w-[330px] shrink-0 h-full rounded-xl border border-zinc-200/80 dark:border-slate-700/80 bg-white/82 dark:bg-slate-900/58 shadow-sm  overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 dark:bg-white dark:bg-slate-900">
                    <div>
                      <span className="text-[0.68rem] uppercase tracking-[0.18em] font-bold text-zinc-500 dark:text-slate-400">Column 1</span>
                      <h3 className="text-[1.05rem] font-bold font-['Outfit'] text-olive-950 dark:text-slate-100 m-0 mt-1 tracking-tight">Epics</h3>
                      <p className="text-zinc-500 dark:text-slate-400 text-[0.78rem] m-0 mt-1">{activeProject.name}</p>
                    </div>
                    <button
                      className="flex items-center justify-center w-10 h-10 bg-olive-900 dark:bg-blue-600 hover:bg-olive-800 dark:hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-40"
                      disabled={!canManageActiveProject}
                      onClick={() => setIsEpicCreateModalOpen(true)}
                      title="New Epic"
                      type="button"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar bg-white dark:bg-slate-900">
                    {activeProjectEpics.map(epic => {
                      const isActive = selectedEpicId === epic.id;
                      return (
                        <div
                          key={epic.id}
                          className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${isActive
                            ? 'bg-blue-50/80 dark:bg-blue-500/8 border-blue-400/60 dark:border-blue-500/40 ring-1 ring-blue-500/20'
                            : 'bg-white/92 dark:bg-slate-800/44 border-zinc-200/80 dark:border-slate-700 hover:border-zinc-300 dark:hover:border-slate-600 hover:-translate-y-[2px]'
                            }`}
                          onClick={() => handleEpicSelect(isActive ? null : epic.id)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className={`text-[0.95rem] font-bold m-0 leading-tight transition-colors ${isActive ? 'text-blue-900 dark:text-blue-100' : 'text-olive-900 dark:text-slate-200'
                              }`}>
                              {epic.name}
                            </h4>
                            <span className={`shrink-0 text-[0.6rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-[0.12em] border ${statusPillCls[epic.status] ?? 'bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-400 border-zinc-200 dark:border-slate-700'
                              }`}>
                              {epic.status}
                            </span>
                          </div>

                          {epic.description && (
                            <p className="text-[0.82rem] m-0 line-clamp-2 leading-relaxed text-zinc-500 dark:text-slate-400">
                              {epic.description}
                            </p>
                          )}

                          {/* Action Toolbar — Always Visible & Integrated */}
                          <div className="flex items-center gap-1.5 mt-2 pt-3 border-t border-zinc-100/90 dark:border-slate-700/50">
                            <button
                              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 hover:text-blue-600 transition-colors"
                              onClick={(e) => { e.stopPropagation(); handleOpenEpicNotesPanel(epic); }}
                              title="Notes"
                            >
                              <FileText size={14} />
                            </button>
                            <button
                              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 hover:text-indigo-600 transition-colors disabled:opacity-40"
                              disabled={!canManageActiveProject}
                              onClick={(e) => { e.stopPropagation(); setEditingEpic(epic); }}
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                            <div className="flex-1" />
                            <button
                              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 hover:text-olive-950 dark:hover:text-white transition-colors disabled:opacity-40"
                              disabled={!canManageActiveProject}
                              onClick={(e) => { e.stopPropagation(); handleMoveEpic(epic, 'up'); }}
                              title="Up"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              className="p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 hover:text-olive-950 dark:hover:text-white transition-colors disabled:opacity-40"
                              disabled={!canManageActiveProject}
                              onClick={(e) => { e.stopPropagation(); handleMoveEpic(epic, 'down'); }}
                              title="Down"
                            >
                              <ChevronDown size={14} />
                            </button>
                            <div className="w-px h-3 bg-zinc-200 dark:bg-slate-800 mx-1" />
                            <button
                              className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-40"
                              disabled={actionEpicId === epic.id || !canManageActiveProject}
                              onClick={(e) => { e.stopPropagation(); handleDeleteEpic(epic.id); }}
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {activeProjectEpics.length === 0 && (
                      <EmptyState description="Create an epic to group your tasks." icon={List} title="No epics found" />
                    )}
                  </div>
                </div>

                {/* Column 2 — Tasks */}
                {selectedEpicId && (
                  <div className="flex flex-col w-[480px] shrink-0 h-full rounded-xl border border-zinc-200/80 dark:border-slate-700/80 bg-white/82 dark:bg-slate-900/58 shadow-sm  overflow-hidden animate-slideInRight">
                    <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-slate-900 dark:bg-white dark:bg-slate-900 border-b border-zinc-200/80 dark:border-slate-700/80">
                      <div>
                        <span className="text-[0.68rem] uppercase tracking-[0.18em] font-bold text-zinc-500 dark:text-slate-400">Column 2</span>
                        <h3 className="text-[1.05rem] font-bold font-['Outfit'] text-olive-950 dark:text-slate-100 m-0 mt-1 tracking-tight">{tasksHeading}</h3>
                        <p className="text-zinc-500 dark:text-slate-400 text-[0.78rem] m-0 mt-1 truncate max-w-[280px]">
                          {epics.find(e => e.id === selectedEpicId)?.name}
                        </p>
                      </div>
                      <button
                        className="flex items-center justify-center w-10 h-10 bg-olive-900 dark:bg-blue-600 hover:bg-olive-800 dark:hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-40"
                        disabled={!canManageActiveProject}
                        onClick={() => {
                          setTaskModalProjectId(activeProject?.id ?? null);
                          setIsTaskCreateModalOpen(true);
                        }}
                        title="New Task"
                        type="button"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <TaskFilterBar 
                      filters={taskFilters}
                      onFilterChange={setTaskFilters}
                      members={activeProjectMembers}
                      epics={epics.filter(e => e.projectId === (activeProject?.id || ''))}
                      onClear={handleClearFilters}
                    />

                    <div className="flex-1 overflow-y-auto p-5 content-start bg-white dark:bg-slate-900">
                      <TaskList
                        epics={epics}
                        onDelete={(taskId) => {
                          const task = tasks.find(t => t.id === taskId);
                          void handleDeleteTask(taskId, task?.title ?? 'this task');
                        }}
                        onEditTask={(task) => setEditingTask(task)}
                        onUpdateStatus={(task, status) => void handleUpdateTaskStatus(task, status)}
                        onUpdateEpic={(task, epicId) => void handleUpdateTaskEpic(task, epicId)}
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
                  <div className="flex flex-col flex-1 min-w-0 h-full rounded-xl border border-zinc-200/80 dark:border-slate-700/80 bg-white/82 dark:bg-slate-900/58 shadow-sm  overflow-hidden animate-slideInRight">
                    <div className="flex items-center justify-between px-6 py-5 bg-white dark:bg-slate-900 dark:bg-white dark:bg-slate-900 border-b border-zinc-200/80 dark:border-slate-700/80">
                      <div>
                        <span className="text-[0.68rem] uppercase tracking-[0.18em] font-bold text-zinc-500 dark:text-slate-400">Column 3</span>
                        <h3 className="text-[1.05rem] font-bold font-['Outfit'] text-olive-950 dark:text-slate-100 m-0 mt-1 tracking-tight">Subtasks</h3>
                        <p className="text-zinc-500 dark:text-slate-400 text-[0.78rem] m-0 mt-1 truncate max-w-[320px]">{activeTask.title}</p>
                      </div>
                      <button
                        className="flex items-center justify-center w-10 h-10 bg-olive-900 dark:bg-blue-600 hover:bg-olive-800 dark:hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-40"
                        disabled={!activeTask.permissions.canUpdate}
                        onClick={() => setSubtaskModalTask(activeTask)}
                        title="New Subtask"
                        type="button"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 content-start bg-white dark:bg-slate-900">
                      {activeTask.subtasks.map(subtask => {
                        const isEditingThisSubtask = editingSubtask?.task.id === activeTask.id && editingSubtask?.subtask.id === subtask.id;
                        return (
                          <div key={subtask.id} className="group relative bg-white dark:bg-slate-900 dark:bg-white dark:bg-slate-900 border border-zinc-200/70 dark:border-slate-700/80 rounded-xl p-5 transition-all duration-300 shadow-sm hover:-translate-y-[2px] hover:border-zinc-300 dark:hover:border-slate-600">
                            <div className="flex items-start justify-between gap-6">
                              <div className="flex items-start gap-4.5 flex-1 min-w-0">
                                <div className="mt-1 relative flex items-center justify-center">
                                  <input
                                    checked={subtask.status === 'completed'}
                                    className="peer w-6 h-6 accent-indigo-600 cursor-pointer rounded-lg border-zinc-300 dark:border-slate-700 transition-all shadow-sm"
                                    disabled={!activeTask.permissions.canUpdate}
                                    onChange={() => void handleUpdateSubtaskStatus(activeTask, subtask, subtask.status === 'completed' ? 'pending' : 'completed')}
                                    type="checkbox"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 min-w-0">
                                  <span className={`text-[1rem] transition-all duration-300 ${subtask.status === 'completed'
                                    ? 'text-zinc-400 dark:text-slate-500 line-through'
                                    : 'text-olive-900 dark:text-slate-200 font-semibold tracking-tight'
                                    }`}>
                                    {subtask.title}
                                  </span>
                                  {!isEditingThisSubtask && subtask.description && (
                                    <p className="text-zinc-400 dark:text-slate-500 text-[0.82rem] leading-relaxed line-clamp-2 opacity-80">{subtask.description}</p>
                                  )}
                                  {!isEditingThisSubtask && subtask.note && (
                                    <div className="flex items-center gap-2 mt-2 px-3 py-1.5 bg-zinc-50 dark:bg-slate-900/40 rounded-xl text-zinc-500 dark:text-slate-400 text-[0.78rem] font-medium italic border border-zinc-100 dark:border-slate-800/50">
                                      <MessageSquare size={14} className="shrink-0 text-indigo-400" />
                                      <span className="truncate">{subtask.note}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                <button
                                  className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700/50 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all disabled:opacity-40"
                                  disabled={!activeTask.permissions.canUpdate}
                                  onClick={() => setEditingSubtask(isEditingThisSubtask ? null : { task: activeTask, subtask })}
                                  title={isEditingThisSubtask ? 'Cancel' : 'Edit Subtask'}
                                  type="button"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button
                                  className="p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-slate-700/50 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                                  onClick={() => handleOpenSubtaskNote(activeTask, subtask)}
                                  title="Subtask Note"
                                  type="button"
                                >
                                  <FileText size={16} />
                                </button>
                                <button
                                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-all disabled:opacity-40"
                                  disabled={!activeTask.permissions.canUpdate}
                                  onClick={() => void handleDeleteSubtask(activeTask, subtask.id)}
                                  title="Delete Subtask"
                                  type="button"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Inline subtask edit form */}
                            {isEditingThisSubtask && (
                              <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-slate-800/50">
                                <SubtaskInlineEdit
                                  subtask={subtask}
                                  onSave={(patch) => void handleUpdateSubtask(activeTask, subtask, patch)}
                                  onCancel={() => setEditingSubtask(null)}
                                  isSaving={actionTaskId === activeTask.id}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {activeTask.subtasks.length === 0 && (
                        <EmptyState description="Break down your task into smaller steps." icon={CheckCircle} title="All clear" />
                      )}

                      {/* Task detail footer */}
                      <div className="mt-8 mb-4">
                        <div className="bg-white dark:bg-slate-900 dark:bg-white dark:bg-slate-900 border border-zinc-200/70 dark:border-slate-700/80 rounded-xl p-8 shadow-sm relative overflow-hidden group/detail">
                          {/* Decorative Glow */}
                          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl group-hover/detail:bg-blue-500/10 transition-all duration-700" />

                          <h4 className="text-[1.05rem] font-bold font-['Outfit'] text-olive-900 dark:text-slate-100 m-0 mb-6 flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                              <Layout size={20} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            Task Properties
                          </h4>

                          {activeTask.description && (
                            <div className="relative">
                              <p className="text-zinc-600 dark:text-slate-400 text-[0.92rem] leading-relaxed mb-8 pl-4 border-l-2 border-zinc-100 dark:border-slate-800 italic">{activeTask.description}</p>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 mb-10">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-[0.72rem] font-black uppercase tracking-wider transition-all duration-500 shadow-sm ${statusPillCls[activeTask.status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}>
                              <CheckCircle size={12} />
                              {activeTask.status.replace('_', ' ')}
                            </div>
                            <SourceBadge source={activeTask.source} />
                            {activeTask.assignedToUser ? (
                              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[0.72rem] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30">
                                Assigned to {activeTask.assignedToUser.name || activeTask.assignedToUser.email}
                              </div>
                            ) : activeTask.projectId ? (
                              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[0.72rem] font-black uppercase tracking-wider bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                Unassigned
                              </div>
                            ) : null}
                          </div>

                          <button
                            className="w-full group/btn relative flex items-center justify-center gap-3 px-6 py-4 bg-olive-900 dark:bg-white text-white dark:text-olive-950 rounded-xl font-bold text-[0.95rem] shadow-sm shadow-zinc-900/20 dark:shadow-white/5 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300 overflow-hidden"
                            onClick={() => handleOpenTaskNote(activeTask)}
                            type="button"
                          >
                            <NotebookPen size={20} className="transition-transform group-hover/btn:rotate-12" />
                            Manage Work Notes

                            {/* Inner Glow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                          </button>
                        </div>
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
      {isChatPanelOpen && activeProject ? (
        <>
          {/* Chat Drawer Backdrop */}
          <div 
            className="fixed inset-0 bg-olive-900/20 backdrop-blur-[2px] z-[2000] animate-in fade-in duration-300"
            onClick={() => setIsChatPanelOpen(false)}
          />
          {/* Chat Drawer Container */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[450px] lg:max-w-[550px] bg-white dark:bg-slate-900 z-[5001] shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden border-l border-zinc-200 dark:border-slate-800 flex flex-col">
            <ChatPanel
              project={activeProject}
              members={activeProjectMembers}
              isOpen={isChatPanelOpen}
              onClose={() => setIsChatPanelOpen(false)}
            />
          </div>
        </>
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
      {isProjectTeamModalOpen && activeProject ? (
        <Modal
          bodyClassName="!p-0"
          onClose={() => setIsProjectTeamModalOpen(false)}
          panelClassName="!max-w-[820px]"
          title={`Team for ${activeProject.name}`}
        >
          <ProjectTeamPanel
            canManageTeam={canManageActiveProject}
            currentUserId={user?.id ?? null}
            isMutating={teamMutationLoading}
            members={activeProjectMembers}
            onAddMember={handleAddProjectMember}
            onRemoveMember={handleRemoveProjectMember}
            onSearchChange={(value) => { void handleProjectMemberSearch(value); }}
            searchResults={memberSearchResults}
            searchTerm={memberSearchTerm}
          />
        </Modal>
      ) : null}
      {isProjectNotesModalOpen && activeProjectForNotes ? (
        <Modal onClose={() => setIsProjectNotesModalOpen(false)} title={activeProjectNotesModalTitle}>
          <ProjectNotes
            actionNoteId={actionNoteId}
            heading="Project notes"
            loading={activeProjectForNotes != null && notesLoadingKey === `project:${activeProjectForNotes.id}`}
            notes={activeProjectNotes}
            onCreateNote={activeProjectForNotes.currentUserRole === 'ADMIN'
              ? () => activeProjectForNotes && handleOpenCreateProjectNote(activeProjectForNotes)
              : undefined}
            onDeleteNote={activeProjectForNotes.currentUserRole === 'ADMIN'
              ? (note) => void handleDeleteNote(note)
              : undefined}
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
            onCreateNote={projects.find((project) => project.id === activeEpicForNotes.projectId)?.currentUserRole === 'ADMIN'
              ? () => handleOpenCreateEpicNote(activeEpicForNotes)
              : undefined}
            onDeleteNote={projects.find((project) => project.id === activeEpicForNotes.projectId)?.currentUserRole === 'ADMIN'
              ? (note) => void handleDeleteNote(note)
              : undefined}
            onOpenNote={(note) => void handleOpenExistingNote(note)}
          />
        </Modal>
      ) : null}
      {editingTask ? (
        <Modal onClose={() => setEditingTask(null)} title={`Edit Task: ${editingTask.title}`}>
          <EditTaskForm
            epics={epics}
            onSubmit={handleUpdateTask}
            projectMembersByProject={projectMembersByProject}
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
