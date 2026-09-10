import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import api from '@/services/api';
import { useWorkspace } from '@/features/workspaces';
import { getIntegration } from '@/lib/sdk-integrations/api';
import { getProjectAiConfig } from '@/services/aiPlanning';
import { SidebarView } from '@/components/Sidebar';
import { Notification } from '@/components/NotificationBox';
import { useChat } from '@/context/ChatContext';
import { TaskFilters } from '@/components/TaskFilterBar';
import { recalculateDynamicPriorities, evaluateTaskPriority, type PriorityEvaluation } from '@/services/priorityEngine';
import { createEpic, deleteEpic, getEpics, updateEpic } from '@/services/epics';
import { createEpicNote, createNote, deleteNote, getEpicNotes, getNote, getProjectNotes, updateNote } from '@/services/notes';
import {
  createProject,
  deleteProject,
  deleteProjects,
  getProjectMembers,
  getProjects,
  leaveProject,
  removeProjectMember,
  updateProject
} from '@/services/projects';
import { bulkAssignTasks, createTask, deleteTask, getTasks, updateTask } from '@/services/tasks';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/context/AuthContext';
import socketService, { SocketEvents } from '@/services/socket';
import type { Epic, EpicStatus } from '@/types/epic';
import type { Note } from '@/types/note';
import type { Project, ProjectMember } from '@/types/project';
import type { Task, TaskWorkflowStatus, TaskPriority } from '@/types/task';
import { findProjectByName } from '@/utils/projectTree';
import { useConfirm } from '@/context/ConfirmationContext';

export type ActiveNoteEditor =
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

export const ALL_PROJECTS_VALUE = '__all__';

export const deriveTaskStatusFromSubtasks = (
  currentStatus: Task['status'],
  subtasks: Array<{ status: TaskWorkflowStatus }>
): Task['status'] => {
  if (subtasks.length === 0) {
    return currentStatus;
  }
  if (subtasks.every((subtask) => subtask.status === 'DONE')) {
    return 'DONE';
  }
  if (currentStatus !== 'DONE') {
    return currentStatus;
  }
  if (subtasks.some((subtask) => subtask.status === 'IN_REVIEW')) {
    return 'IN_REVIEW';
  }
  if (subtasks.some((subtask) => subtask.status === 'IN_PROGRESS')) {
    return 'IN_PROGRESS';
  }
  return 'TODO';
};

export function useDashboard() {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, epicId, integrationId } = useParams();
  const { activeWorkspaceId } = useWorkspace();

  const [selectedDate, setSelectedDate] = useState<string>(getTodayDate);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
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

  const [sidePanelTab, setSidePanelTab] = useState<'subtasks' | 'comments'>('subtasks');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Auto dismiss feedback alerts
  useEffect(() => {
    const feedbackStates = [
      { value: taskMutationSuccess, setter: setTaskMutationSuccess },
      { value: taskMutationError, setter: setTaskMutationError },
      { value: projectMutationSuccess, setter: setProjectMutationSuccess },
      { value: projectMutationError, setter: setProjectMutationError },
      { value: epicMutationSuccess, setter: setEpicMutationSuccess },
      { value: epicMutationError, setter: setEpicMutationError },
      { value: noteMutationSuccess, setter: setNoteMutationSuccess },
      { value: noteMutationError, setter: setNoteMutationError },
      { value: error, setter: setError }
    ];

    const timers = feedbackStates
      .filter(s => s.value !== null)
      .map(s => setTimeout(() => s.setter(null), 5000));

    return () => timers.forEach(clearTimeout);
  }, [
    taskMutationSuccess, taskMutationError,
    projectMutationSuccess, projectMutationError,
    epicMutationSuccess, epicMutationError,
    noteMutationSuccess, noteMutationError,
    error
  ]);

  const [isProjectCreateModalOpen, setIsProjectCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isEpicCreateModalOpen, setIsEpicCreateModalOpen] = useState(false);
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null);
  const [activeProjectAiEnabled, setActiveProjectAiEnabled] = useState(false);
  const [activeProjectAiProvider, setActiveProjectAiProvider] = useState<string | null>(null);

  const [taskFilters, setTaskFilters] = useState<TaskFilters>({
    search: '',
    status: 'all',
    assigneeId: 'all'
  });

  const handleClearFilters = () => {
    setTaskFilters({
      search: '',
      status: 'all',
      assigneeId: 'all'
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
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [projectNotes, setProjectNotes] = useState<Record<string, Note[]>>({});
  const [epicNotes, setEpicNotes] = useState<Record<string, Note[]>>({});
  const [projectMembersByProject, setProjectMembersByProject] = useState<Record<string, ProjectMember[]>>({});
  const [notesLoadingKey, setNotesLoadingKey] = useState<string | null>(null);
  const [projectPage, setProjectPage] = useState(1);
  const [projectTotalPages, setProjectTotalPages] = useState<number>(1);
  const [projectSearchTerm, setProjectSearchTerm] = useState<string>('');
  const debouncedProjectSearchTerm = useDebounce(projectSearchTerm, 300);
  const debouncedTaskSearchTerm = useDebounce(taskFilters.search, 300);

  const [teamMutationLoading, setTeamMutationLoading] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<SidebarView>('dashboard');
  const [activeProjectForNotes, setActiveProjectForNotes] = useState<Project | null>(null);
  const [activeEpicForNotes, setActiveEpicForNotes] = useState<Epic | null>(null);
  const [activeNoteEditor, setActiveNoteEditor] = useState<ActiveNoteEditor | null>(null);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [isActivityHistoryOpen, setIsActivityHistoryOpen] = useState(false);
  const [isAiPlanningWorkspaceOpen, setIsAiPlanningWorkspaceOpen] = useState(false);

  const [priorityEvaluationModalOpen, setPriorityEvaluationModalOpen] = useState(false);
  const [priorityEvaluationResult, setPriorityEvaluationResult] = useState<PriorityEvaluation | null>(null);
  const [isRecalculatingPriorities, setIsRecalculatingPriorities] = useState(false);
  const [isEvaluatingPriority, setIsEvaluatingPriority] = useState(false);

  const { lastMessage, clearLastMessage, setActiveProject } = useChat();
  const [activeIntegrationName, setActiveIntegrationName] = useState<string>('');

  useEffect(() => {
    const fetchIntegrationDetails = async () => {
      if (integrationId) {
        try {
          const data = await getIntegration(integrationId);
          setActiveIntegrationName(data.name);
        } catch (err) {
          console.error('Failed to fetch integration name for sidebar', err);
          setActiveIntegrationName('');
        }
      } else {
        setActiveIntegrationName('');
      }
    };
    void fetchIntegrationDetails();
  }, [integrationId]);

  // Sync state with URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/intelligence') {
      setActiveView('semantic-intelligence');
    } else if (path === '/prompts') {
      setActiveView('prompts');
    } else if (path === '/playground') {
      setActiveView('playground');
    } else if (path === '/event-tracking') {
      setActiveView('event-tracking');
    } else if (path === '/engagement') {
      setActiveView('engagement');
    } else if (path.startsWith('/sdk-integrations/')) {
      setActiveView('sdk-integration-detail');
    } else if (path === '/sdk-integrations') {
      setActiveView('sdk-integrations');
    } else if (path === '/sdk-docs') {
      setActiveView('sdk-docs');
    } else if (path === '/settings') {
      setActiveView('settings');
    } else if (path.startsWith('/projects/')) {
      setActiveView('dashboard');
      if (projectId) {
        setSelectedProjectView(projectId);
      }
      if (epicId) {
        setSelectedEpicId(epicId);
      } else {
        setSelectedEpicId(null);
      }
    } else if (path === '/dashboard') {
      setActiveView('dashboard');
      setSelectedProjectView(ALL_PROJECTS_VALUE);
      setSelectedEpicId(null);
    }
  }, [location.pathname, projectId, epicId, integrationId]);

  const loadDashboard = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [taskList, projectData] = await Promise.all([
        getTasks(
          selectedDate,
          taskFilters.assigneeId === 'all' ? undefined : taskFilters.assigneeId,
          debouncedTaskSearchTerm.trim() || undefined
        ),
        getProjects({ page: projectPage, limit: 10, search: debouncedProjectSearchTerm.trim() })
      ]);
      const projectList = projectData.projects;

      const epicResults = await Promise.allSettled(
        projectList.map((project: Project) => getEpics(project.id))
      );

      const epicGroups = epicResults
        .filter((result): result is PromiseFulfilledResult<Epic[]> => result.status === 'fulfilled')
        .map((result) => result.value);

      setTasks(taskList);
      setProjects(projectList);
      setEpics(epicGroups.flat());
      setProjectTotalPages(projectData.totalPages);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError('Unable to load some data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, projectPage, debouncedProjectSearchTerm, taskFilters.assigneeId, debouncedTaskSearchTerm]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const handleTaskAssigned = () => {
      void loadDashboard();
      setTaskMutationSuccess('Tasks updated');
    };
    socketService.on(SocketEvents.TASK_ASSIGNED, handleTaskAssigned);
    socketService.on(SocketEvents.TASK_BULK_ASSIGNED, handleTaskAssigned);
    return () => {
      socketService.off(SocketEvents.TASK_ASSIGNED, handleTaskAssigned);
      socketService.off(SocketEvents.TASK_BULK_ASSIGNED, handleTaskAssigned);
    };
  }, [loadDashboard]);

  const loadProjectTeam = useCallback(async (projId: string): Promise<void> => {
    try {
      const members = await getProjectMembers(projId);
      setProjectMembersByProject((current) => ({
        ...current,
        [projId]: members
      }));
    } catch {
      setProjectMutationError('Unable to load the project team.');
    }
  }, []);

  const handleCreateTask = async (payload: {
    title: string;
    description?: string;
    note?: string;
    status?: TaskWorkflowStatus;
    priority?: TaskPriority;
    projectId?: string | null;
    epicId?: string | null;
    assignedTo?: string;
  }): Promise<void> => {
    await createTask({
      title: payload.title.trim(),
      description: payload.description?.trim(),
      note: payload.note?.trim(),
      date: selectedDate,
      status: payload.status,
      priority: payload.priority,
      source: 'manual',
      projectId: payload.projectId,
      epicId: payload.epicId,
      assignedTo: payload.assignedTo
    });
    await loadDashboard();
    setIsTaskCreateModalOpen(false);
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const handleBulkAssign = async (userId: string) => {
    if (selectedTaskIds.length === 0) return;
    try {
      setLoading(true);
      await bulkAssignTasks(selectedTaskIds, userId);
      setTaskMutationSuccess(`Successfully assigned ${selectedTaskIds.length} tasks`);
      setSelectedTaskIds([]);
      await loadDashboard();
    } catch {
      setTaskMutationError('Failed to bulk assign tasks');
    } finally {
      setLoading(false);
    }
  };

  const activeProject = useMemo(() => {
    if (selectedProjectView === ALL_PROJECTS_VALUE) {
      return null;
    }
    return projects.find((project) => project.id === selectedProjectView) ?? null;
  }, [projects, selectedProjectView]);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevProjectsRef = useRef<Project[]>([]);

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

  useEffect(() => {
    if (lastMessage) {
      if (!isChatPanelOpen) {
        if (lastMessage.sender?.id === user?.id || lastMessage.senderId === user?.id) {
          clearLastMessage();
          return;
        }
        const newNotification: Notification = {
          id: lastMessage.id,
          type: 'message',
          title: lastMessage.sender?.name || lastMessage.sender?.email || 'New Message',
          message: lastMessage.content,
          timestamp: new Date(lastMessage.createdAt),
          isRead: false,
          projectId: activeProject?.id,
        };
        setNotifications((prev: Notification[]) => {
          if (prev.some(n => n.id === lastMessage.id)) return prev;
          return [newNotification, ...prev];
        });
      }
      clearLastMessage();
    }
  }, [lastMessage, isChatPanelOpen, activeProject, user?.id, clearLastMessage]);

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
  const canManageActiveProject = !!activeProject;
  const canManageTeam = activeProject?.currentUserRole === 'ADMIN';

  const visibleTasks = useMemo(() => {
    let filtered = tasks;
    if (selectedProjectView !== ALL_PROJECTS_VALUE) {
      filtered = filtered.filter((task) => task.projectId === selectedProjectView);
    }
    if (taskFilters.status !== 'all') {
      filtered = filtered.filter((task) => task.status === taskFilters.status);
    }
    if (taskFilters.assigneeId !== 'all') {
      filtered = filtered.filter((task) =>
        task.assignedTo?.id === taskFilters.assigneeId ||
        task.subtasks.some((st) => st.assignedToUserId === taskFilters.assigneeId)
      );
    }
    if (taskFilters.search.trim()) {
      const term = taskFilters.search.trim().toLowerCase();
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
      setActiveProject(null);
      setActiveProjectAiEnabled(false);
      setActiveProjectAiProvider(null);
      return;
    }
    setActiveProject(activeProject);
    if (projectMembersByProject[activeProject.id] == null) {
      void loadProjectTeam(activeProject.id);
    }
    const loadAiConfigStatus = async () => {
      try {
        const config = await getProjectAiConfig(activeProject.id);
        setActiveProjectAiEnabled(config.enabled);
        setActiveProjectAiProvider(config.provider);
      } catch {
        setActiveProjectAiEnabled(false);
        setActiveProjectAiProvider(null);
      }
    };
    void loadAiConfigStatus();
  }, [activeProject, loadProjectTeam, projectMembersByProject, setActiveProject]);

  useEffect(() => {
    if (editingTask?.projectId && projectMembersByProject[editingTask.projectId] == null) {
      void loadProjectTeam(editingTask.projectId);
    }
  }, [editingTask, loadProjectTeam, projectMembersByProject]);

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

  const handleProjectSelect = (projId: string): void => {
    if (projId === ALL_PROJECTS_VALUE) {
      navigate('/dashboard');
    } else {
      navigate(`/projects/${projId}`);
    }
    setSelectedTaskId(null);
  };

  const handleProjectPageChange = (p: number): void => {
    setProjectPage(p);
  };

  const handleProjectSearch = (term: string): void => {
    setProjectSearchTerm(term);
    setProjectPage(1);
  };

  const handleEpicSelect = (epicIdToSelect: string | null): void => {
    if (activeProject) {
      if (epicIdToSelect) {
        navigate(`/projects/${activeProject.id}/epics/${epicIdToSelect}`);
      } else {
        navigate(`/projects/${activeProject.id}`);
      }
    } else if (selectedProjectView !== ALL_PROJECTS_VALUE) {
      if (epicIdToSelect) {
        navigate(`/projects/${selectedProjectView}/epics/${epicIdToSelect}`);
      } else {
        navigate(`/projects/${selectedProjectView}`);
      }
    }
    setSelectedTaskId(null);
  };

  const handleCreateEpic = async (payload: {
    description?: string;
    name: string;
    status: EpicStatus;
  }): Promise<void> => {
    if (activeProject == null) return;
    setActionEpicId('new');
    setEpicMutationError(null);
    setEpicMutationSuccess(null);
    try {
      await createEpic(activeProject.id, {
        ...payload,
        name: payload.name.trim(),
        description: payload.description?.trim()
      });
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
    if (activeProject == null || editingEpic == null) return;
    setActionEpicId(editingEpic.id);
    setEpicMutationError(null);
    setEpicMutationSuccess(null);
    try {
      await updateEpic(activeProject.id, editingEpic.id, {
        ...payload,
        name: payload.name.trim(),
        description: payload.description?.trim()
      });
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

  const handleDeleteEpic = async (targetEpicId: string) => {
    const targetEpic = epics.find((e) => e.id === targetEpicId);
    if (!targetEpic) return;
    const isConfirmed = await confirm({
      title: 'Delete Epic',
      message: `Delete epic "${targetEpic.name}"? Tasks will remain and move to "No Epic".`,
      confirmText: 'Delete Epic',
      type: 'danger'
    });
    if (!isConfirmed) return;
    setActionEpicId(targetEpic.id);
    setEpicMutationError(null);
    setEpicMutationSuccess(null);
    try {
      await deleteEpic(targetEpic.projectId, targetEpic.id);
      await loadDashboard();
      setEpicMutationSuccess('Epic deleted. Related tasks were preserved and unassigned.');
      setEpicNotes((current) => {
        const next = { ...current };
        delete next[targetEpic.id];
        return next;
      });
      if (editingEpic?.id === targetEpic.id) {
        setEditingEpic(null);
      }
      if (activeEpicForNotes?.id === targetEpic.id) {
        setActiveEpicForNotes(null);
        setIsEpicNotesModalOpen(false);
      }
    } catch {
      setEpicMutationError('Unable to delete the epic.');
    } finally {
      setActionEpicId(null);
    }
  };

  const handleCreateProject = async (payload: { name: string; description?: string }): Promise<void> => {
    setActionProjectId('new');
    setProjectMutationError(null);
    setProjectMutationSuccess(null);
    try {
      const trimmedName = payload.name.trim();
      const existingProject = findProjectByName(projects, trimmedName);
      if (existingProject) {
        setProjectMutationSuccess('Project already exists.');
        setIsProjectCreateModalOpen(false);
        return;
      }
      await createProject({
        ...payload,
        name: trimmedName,
        description: payload.description?.trim()
      });
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
    if (editingProject == null) return;
    setActionProjectId(editingProject.id);
    setProjectMutationError(null);
    setProjectMutationSuccess(null);
    try {
      await updateProject(editingProject.id, {
        ...payload,
        name: payload.name.trim(),
        description: payload.description?.trim()
      });
      await loadDashboard();
      setProjectMutationSuccess('Project updated.');
      setEditingProject(null);
    } catch {
      setProjectMutationError('Unable to update the project.');
    } finally {
      setActionProjectId(null);
    }
  };

  const handleDeleteProject = async (projId: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Project',
      message: 'Are you sure you want to delete this project? All associated tasks, epics, and notes will be permanently removed.',
      confirmText: 'Delete Project',
      type: 'danger'
    });
    if (!isConfirmed) return;
    setActionProjectId(projId);
    try {
      await deleteProject(projId);
      await loadDashboard();
      if (selectedProjectView === projId) {
        setSelectedProjectView(ALL_PROJECTS_VALUE);
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
      // Handled
    } finally {
      setActionProjectId(null);
    }
  };

  const handleInviteProjectMember = async (email: string, role: 'ADMIN' | 'MEMBER'): Promise<void> => {
    if (activeProject == null) return;
    setTeamMutationLoading(true);
    setProjectMutationError(null);
    setProjectMutationSuccess(null);
    try {
      await api.post(`/invitations/projects/${activeProject.id}`, { email, role });
      await Promise.all([loadDashboard(), loadProjectTeam(activeProject.id)]);
      setProjectMutationSuccess('Member successfully added or invited.');
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      setProjectMutationError(errorObj.response?.data?.error || 'Failed to process request.');
    } finally {
      setTeamMutationLoading(false);
    }
  };

  const handleRemoveProjectMember = async (userId: string): Promise<void> => {
    if (activeProject == null) return;
    const member = (projectMembersByProject[activeProject.id] ?? []).find((entry) => entry.userId === userId);
    if (member?.role === 'ADMIN') {
      setProjectMutationError('Project admins cannot be removed from the team.');
      return;
    }
    const label = member?.user.name || member?.user.email || 'this member';
    const isConfirmed = await confirm({
      title: 'Remove Project Member',
      message: `Remove ${label} from ${activeProject.name}? Assigned tasks will be unassigned.`,
      confirmText: 'Remove Member',
      type: 'danger'
    });
    if (!isConfirmed) return;
    setTeamMutationLoading(true);
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

  const handleLeaveProject = async (): Promise<void> => {
    if (activeProject == null) return;
    const isConfirmed = await confirm({
      title: 'Leave Project',
      message: `Are you sure you want to leave ${activeProject.name}? You will no longer access this project and tasks assigned to you will be unassigned.`,
      confirmText: 'Leave Project',
      type: 'danger'
    });
    if (!isConfirmed) return;
    setTeamMutationLoading(true);
    try {
      await leaveProject(activeProject.id);
      setIsProjectTeamModalOpen(false);
      handleProjectSelect(ALL_PROJECTS_VALUE);
      await loadDashboard();
      setProjectMutationSuccess('You have left the project.');
    } catch {
      setProjectMutationError('Unable to leave the project.');
    } finally {
      setTeamMutationLoading(false);
    }
  };

  const handleUpdateTask = async (payload: {
    title: string;
    description?: string;
    note?: string;
    date: string;
    status: TaskWorkflowStatus;
    priority?: TaskPriority;
    isBlocked?: boolean;
    blockedByTaskId?: string | null;
    projectId: string | null;
    epicId: string | null;
    assignedTo?: string;
  }): Promise<void> => {
    if (editingTask == null) return;
    setActionTaskId(editingTask.id);
    try {
      await updateTask(editingTask.id, {
        title: payload.title.trim(),
        description: payload.description?.trim(),
        note: payload.note?.trim(),
        date: payload.date,
        status: payload.status,
        priority: payload.priority,
        isBlocked: payload.isBlocked,
        blockedByTaskId: payload.blockedByTaskId,
        projectId: payload.projectId,
        epicId: payload.epicId,
        assignedTo: payload.assignedTo,
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

  const handleUpdateTaskStatus = async (targetTask: Task, status: TaskWorkflowStatus, skipConfirm = false) => {
    if (!skipConfirm) {
      const isConfirmed = await confirm({
        title: 'Update Task Status',
        message: `Update the status for "${targetTask.title}" to "${status.replace('_', ' ')}"?`,
        confirmText: 'Update Status',
        type: 'info'
      });
      if (!isConfirmed) return;
    }
    setActionTaskId(targetTask.id);
    try {
      const updates = status === 'DONE' ? {
        status,
        subtasks: targetTask.subtasks.map((subtask) => ({
          title: subtask.title,
          note: subtask.note,
          status: 'DONE' as const,
          completedAt: subtask.completedAt ?? new Date().toISOString()
        }))
      } : { status };
      await updateTask(targetTask.id, updates);
      await loadDashboard();
      setTaskMutationSuccess('Task status updated.');
    } catch {
      setTaskMutationError('Unable to update the task status.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleUpdateTaskEpic = async (targetTask: Task, targetEpicId: string | null): Promise<void> => {
    setActionTaskId(targetTask.id);
    try {
      await updateTask(targetTask.id, { projectId: targetTask.projectId, epicId: targetEpicId });
      await loadDashboard();
      setTaskMutationSuccess(targetEpicId ? 'Task epic updated.' : 'Task moved to No Epic.');
    } catch {
      setTaskMutationError('Unable to update the task epic.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleDeleteTask = async (targetTaskId: string, taskTitle: string) => {
    const isConfirmed = await confirm({
      title: 'Delete Task',
      message: `Delete "${taskTitle}"?`,
      confirmText: 'Delete Task',
      type: 'danger'
    });
    if (!isConfirmed) return;
    setActionTaskId(targetTaskId);
    try {
      await deleteTask(targetTaskId);
      await loadDashboard();
      setTaskMutationSuccess('Task deleted.');
    } catch {
      setTaskMutationError('Unable to delete the task.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleUpdateSubtaskStatus = async (
    targetTask: Task,
    targetSubtask: Task['subtasks'][number],
    status: TaskWorkflowStatus
  ): Promise<void> => {
    const previousTasks = [...tasks];
    const updatedSubtasks = targetTask.subtasks.map((subtask) => {
      if (subtask.id !== targetSubtask.id) return subtask;
      return {
        ...subtask,
        status,
        completed: status === 'DONE',
        completedAt: status === 'DONE' ? new Date().toISOString() : null
      };
    });
    const updatedTask = {
      ...targetTask,
      status: deriveTaskStatusFromSubtasks(targetTask.status, updatedSubtasks),
      subtasks: updatedSubtasks
    };
    setTasks((prev) => prev.map((t) => t.id === targetTask.id ? updatedTask : t));
    try {
      await updateTask(targetTask.id, { status: updatedTask.status, subtasks: updatedSubtasks });
      await loadDashboard();
      setTaskMutationSuccess('Subtask updated.');
    } catch (err) {
      setTasks(previousTasks);
      setTaskMutationError('Unable to update the subtask.');
      console.error('Subtask update failed:', err);
    }
  };

  const handleUpdateSubtask = async (
    targetTask: Task,
    targetSubtask: Task['subtasks'][number],
    patch: { title: string; description?: string; note?: string; assignedToUserId?: string | null }
  ): Promise<void> => {
    setActionTaskId(targetTask.id);
    try {
      const subtasks = targetTask.subtasks.map((subtask) => (
        subtask.id === targetSubtask.id
          ? {
            ...subtask,
            title: patch.title.trim(),
            description: patch.description?.trim(),
            note: patch.note?.trim(),
            assignedToUserId: patch.assignedToUserId
          }
          : subtask
      ));
      await updateTask(targetTask.id, { status: targetTask.status as TaskWorkflowStatus, subtasks });
      await loadDashboard();
      setTaskMutationSuccess('Subtask updated.');
      setEditingSubtask(null);
    } catch {
      setTaskMutationError('Unable to update the subtask.');
    } finally {
      setActionTaskId(null);
    }
  };

  const handleCreateSubtask = async (
    payload: Array<{ title: string; description?: string; note?: string; status: TaskWorkflowStatus }>
  ): Promise<void> => {
    if (subtaskModalTask == null) return;
    setActionTaskId(subtaskModalTask.id);
    try {
      const subtasks = [
        ...subtaskModalTask.subtasks,
        ...payload.map((subtask) => ({
          title: subtask.title.trim(),
          description: subtask.description?.trim(),
          note: subtask.note?.trim(),
          status: subtask.status,
          completedAt: subtask.status === 'DONE' ? new Date().toISOString() : null
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

  const handleDeleteSubtask = async (targetTask: Task, subtaskId: string) => {
    const targetSubtask = targetTask.subtasks.find((s) => s.id === subtaskId);
    if (!targetSubtask) return;
    const isConfirmed = await confirm({
      title: 'Delete Subtask',
      message: `Remove sub-task "${targetSubtask.title}" from "${targetTask.title}"?`,
      confirmText: 'Delete Subtask',
      type: 'danger'
    });
    if (!isConfirmed) return;
    setActionTaskId(targetTask.id);
    try {
      const subtasks = targetTask.subtasks.filter((subtask) => subtask.id !== targetSubtask.id);
      await updateTask(targetTask.id, {
        status: deriveTaskStatusFromSubtasks(targetTask.status, subtasks),
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

  const handleRecalculatePriorities = async () => {
    setIsRecalculatingPriorities(true);
    try {
      const result = await recalculateDynamicPriorities();
      setTaskMutationSuccess(`Recalculated priorities for ${result.count} tasks`);
      await loadDashboard();
    } catch {
      setTaskMutationError('Failed to recalculate priorities');
    }
    setIsRecalculatingPriorities(false);
  };

  const handleEvaluatePriority = async (taskIdToEval: string) => {
    setIsEvaluatingPriority(true);
    try {
      const evaluation = await evaluateTaskPriority(taskIdToEval);
      setPriorityEvaluationResult(evaluation);
      setPriorityEvaluationModalOpen(true);
    } catch {
      setTaskMutationError('Failed to evaluate priority');
    }
    setIsEvaluatingPriority(false);
  };

  const handleToggleBlocked = async (targetTask: Task): Promise<void> => {
    const previousTasks = [...tasks];
    const isBlocked = !targetTask.isBlocked;
    const updatedTask = { ...targetTask, isBlocked };
    setTasks((prev) => prev.map((t) => t.id === targetTask.id ? updatedTask : t));
    try {
      await updateTask(targetTask.id, { isBlocked });
      setTaskMutationSuccess(isBlocked ? 'Task marked as blocked.' : 'Task unblocked.');
    } catch (err) {
      setTasks(previousTasks);
      setTaskMutationError('Unable to update blocked status.');
      console.error('Blocked toggle failed:', err);
    }
  };

  const loadNotesForProject = useCallback(async (projId: string): Promise<void> => {
    setNotesLoadingKey(`project:${projId}`);
    try {
      const notes = await getProjectNotes(projId);
      setProjectNotes((current) => ({ ...current, [projId]: notes }));
    } catch {
      setNoteMutationError('Unable to load notes for this project.');
    } finally {
      setNotesLoadingKey((current) => (current === `project:${projId}` ? null : current));
    }
  }, []);

  const loadNotesForEpic = useCallback(async (projId: string, epicIdToLoad: string): Promise<void> => {
    setNotesLoadingKey(`epic:${epicIdToLoad}`);
    try {
      const notes = await getEpicNotes(projId, epicIdToLoad);
      setEpicNotes((current) => ({ ...current, [epicIdToLoad]: notes }));
    } catch {
      setNoteMutationError('Unable to load notes for this epic.');
    } finally {
      setNotesLoadingKey((current) => (current === `epic:${epicIdToLoad}` ? null : current));
    }
  }, []);

  const handleOpenCreateProjectNote = (project: Project): void => {
    setActiveNoteEditor({
      kind: 'project',
      note: null,
      projectId: project.id,
      projectName: project.name
    });
  };

  const handleOpenCreateEpicNote = (epicToNote: Epic): void => {
    setActiveNoteEditor({
      kind: 'epic',
      epicId: epicToNote.id,
      epicName: epicToNote.name,
      note: null,
      projectId: epicToNote.projectId
    });
  };

  const handleOpenExistingNote = async (note: Note): Promise<void> => {
    setActionNoteId(note.id);
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
        const projectName = projects.find((project) => project.id === latestNote.projectId)?.name ?? activeProject?.name ?? 'Project';
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
    if (activeNoteEditor == null) return;
    const editor = activeNoteEditor;
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
        } else {
          const created = await createNote(editor.projectId, { title: payload.title ?? '', content: payload.content });
          setProjectNotes((current) => ({
            ...current,
            [editor.projectId]: [created, ...(current[editor.projectId] ?? [])]
          }));
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
        } else {
          const created = await createEpicNote(editor.projectId, editor.epicId, { title: payload.title ?? '', content: payload.content });
          setEpicNotes((current) => ({
            ...current,
            [editor.epicId]: [created, ...(current[editor.epicId] ?? [])]
          }));
        }
      } else if (editor.kind === 'task') {
        await updateTask(editor.task.id, { note: payload.content });
        await loadDashboard();
      } else {
        const latestTask = tasks.find((task) => task.id === editor.task.id) ?? editor.task;
        const subtasks = latestTask.subtasks.map((subtask) => (
          subtask.id === editor.subtask.id ? { ...subtask, note: payload.content } : subtask
        ));
        await updateTask(latestTask.id, {
          status: deriveTaskStatusFromSubtasks(latestTask.status, subtasks),
          subtasks
        });
        await loadDashboard();
      }
      setActiveNoteEditor(null);
    } catch {
      setNoteMutationError('Unable to save the note.');
      throw new Error('Unable to save note');
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
    } catch {
      setNoteMutationError('Unable to delete the note.');
    }
  };

  const handleDeleteInlineNote = async (): Promise<void> => {
    if (activeNoteEditor == null || activeNoteEditor.kind === 'project' || activeNoteEditor.kind === 'epic') return;
    try {
      if (activeNoteEditor.kind === 'task') {
        await updateTask(activeNoteEditor.task.id, { note: '' });
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
      }
      await loadDashboard();
      setActiveNoteEditor(null);
    } catch {
      setNoteMutationError('Unable to delete the note.');
    }
  };

  const handleOpenTaskNote = (targetTask: Task): void => {
    setActiveNoteEditor({
      kind: 'task',
      task: tasks.find((currentTask) => currentTask.id === targetTask.id) ?? targetTask
    });
  };

  const handleOpenSubtaskNote = (targetTask: Task, subtask: Task['subtasks'][number]): void => {
    setActiveNoteEditor({
      kind: 'subtask',
      task: tasks.find((currentTask) => currentTask.id === targetTask.id) ?? targetTask,
      subtask: (tasks.find((currentTask) => currentTask.id === targetTask.id)?.subtasks.find((currentSubtask) => currentSubtask.id === subtask.id) ?? subtask)
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

  const handleOpenEpicNotesPanel = (epicToOpen: Epic): void => {
    if (epicNotes[epicToOpen.id] == null) {
      void loadNotesForEpic(epicToOpen.projectId, epicToOpen.id);
    }
    setActiveEpicForNotes(epicToOpen);
    setIsEpicNotesModalOpen(true);
  };

  const activeEpicTasks = useMemo(() => {
    if (!selectedEpicId) return [];
    return visibleTasks.filter(t => t.epicId === selectedEpicId);
  }, [selectedEpicId, visibleTasks]);

  const activeTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return tasks.find(t => t.id === selectedTaskId) ?? null;
  }, [selectedTaskId, tasks]);

  return {
    user,
    logout: handleLogout,
    selectedDate,
    setSelectedDate,
    tasks,
    projects,
    epics,
    loading,
    viewMode,
    setViewMode,
    error,
    setError,
    actionTaskId,
    actionProjectId,
    actionEpicId,
    actionNoteId,
    taskMutationError,
    setTaskMutationError,
    taskMutationSuccess,
    setTaskMutationSuccess,
    projectMutationError,
    setProjectMutationError,
    projectMutationSuccess,
    setProjectMutationSuccess,
    epicMutationError,
    setEpicMutationError,
    epicMutationSuccess,
    setEpicMutationSuccess,
    noteMutationError,
    setNoteMutationError,
    noteMutationSuccess,
    setNoteMutationSuccess,
    sidePanelTab,
    setSidePanelTab,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    isProjectCreateModalOpen,
    setIsProjectCreateModalOpen,
    editingProject,
    setEditingProject,
    isEpicCreateModalOpen,
    setIsEpicCreateModalOpen,
    editingEpic,
    setEditingEpic,
    activeProjectAiEnabled,
    setActiveProjectAiEnabled,
    activeProjectAiProvider,
    setActiveProjectAiProvider,
    taskFilters,
    setTaskFilters,
    handleClearFilters,
    isProjectNotesModalOpen,
    setIsProjectNotesModalOpen,
    isEpicNotesModalOpen,
    setIsEpicNotesModalOpen,
    isTaskCreateModalOpen,
    setIsTaskCreateModalOpen,
    isProjectTeamModalOpen,
    setIsProjectTeamModalOpen,
    selectedProjectView,
    setSelectedProjectView,
    selectedEpicId,
    setSelectedEpicId,
    selectedTaskId,
    setSelectedTaskId,
    taskModalProjectId,
    setTaskModalProjectId,
    subtaskModalTask,
    setSubtaskModalTask,
    editingTask,
    setEditingTask,
    editingSubtask,
    setEditingSubtask,
    selectedTaskIds,
    setSelectedTaskIds,
    projectNotes,
    epicNotes,
    projectMembersByProject,
    notesLoadingKey,
    projectPage,
    projectTotalPages,
    projectSearchTerm,
    teamMutationLoading,
    activeView,
    setActiveView,
    activeProjectForNotes,
    setActiveProjectForNotes,
    activeEpicForNotes,
    setActiveEpicForNotes,
    activeNoteEditor,
    setActiveNoteEditor,
    isChatPanelOpen,
    setIsChatPanelOpen,
    isActivityHistoryOpen,
    setIsActivityHistoryOpen,
    isAiPlanningWorkspaceOpen,
    setIsAiPlanningWorkspaceOpen,
    priorityEvaluationModalOpen,
    setPriorityEvaluationModalOpen,
    priorityEvaluationResult,
    setPriorityEvaluationResult,
    isRecalculatingPriorities,
    isEvaluatingPriority,
    activeIntegrationName,
    activeWorkspaceId,
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    loadDashboard,
    loadProjectTeam,
    handleCreateTask,
    handleToggleTaskSelection,
    handleBulkAssign,
    activeProject,
    activeProjectMembers,
    canManageActiveProject,
    canManageTeam,
    visibleTasks,
    tasksHeading,
    activeProjectEpics,
    activeProjectNotes,
    activeEpicNotes,
    activeProjectNotesModalTitle,
    activeEpicNotesModalTitle,
    handleProjectSelect,
    handleProjectPageChange,
    handleProjectSearch,
    handleEpicSelect,
    activeEpicTasks,
    activeTask,
    handleMarkAsRead,
    handleClearAll,
    handleNotificationClick,
    handleCreateEpic,
    handleUpdateEpic,
    handleDeleteEpic,
    handleCreateProject,
    handleUpdateProject,
    handleDeleteProject,
    handleDeleteProjects,
    handleInviteProjectMember,
    handleRemoveProjectMember,
    handleLeaveProject,
    handleUpdateTask,
    handleUpdateTaskStatus,
    handleUpdateTaskEpic,
    handleDeleteTask,
    handleUpdateSubtaskStatus,
    handleUpdateSubtask,
    handleCreateSubtask,
    handleDeleteSubtask,
    handleRecalculatePriorities,
    handleEvaluatePriority,
    handleToggleBlocked,
    loadNotesForProject,
    loadNotesForEpic,
    handleOpenCreateProjectNote,
    handleOpenCreateEpicNote,
    handleOpenExistingNote,
    handleSaveNote,
    handleDeleteNote,
    handleDeleteInlineNote,
    handleOpenTaskNote,
    handleOpenSubtaskNote,
    handleOpenProjectNotesPanel,
    handleOpenEpicNotesPanel,
  };
}
