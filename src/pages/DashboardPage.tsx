import { useNavigate, useParams } from 'react-router-dom';
import AddTaskForm from '@/components/AddTaskForm';
import DateNavigator from '@/components/DateNavigator';
import EditTaskForm from '@/components/EditTaskForm';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import EpicForm from '@/components/EpicForm';
import NoteModal from '@/components/NoteModal';
import ProjectForm from '@/components/ProjectForm';
import ProjectNotes from '@/components/ProjectNotes';
import ProjectPanel from '@/components/ProjectPanel';
import ProjectTeamPanel from '@/components/ProjectTeamPanel';
import SettingsPanel from '@/components/SettingsPanel';
import SubtaskForm from '@/components/SubtaskForm';
import ChatPanel from '@/components/ChatPanel';
import { ActivityHistoryPanel } from '@/features/projects';
import { AiProjectPlanModal } from '@/features/projects';
import SdkDocsPanel from '@/components/SdkDocsPanel';
import EventTrackingPage from '@/pages/EventTrackingPage';
import SemanticIntelligencePage from '@/pages/SemanticIntelligencePage';
import EngagementPage from '@/pages/EngagementPage';
import SdkIntegrationsPage from '@/pages/SdkIntegrationsPage';
import SdkIntegrationDetailPage from '@/pages/SdkIntegrationDetailPage';
import PromptLibraryPage from '@/pages/PromptLibraryPage';
import PromptPlaygroundPage from '@/pages/PromptPlaygroundPage';
import Sidebar, { SidebarView } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import type { TaskWorkflowStatus } from '@/types/task';
import InvitationNotificationPanel from '@/components/InvitationNotificationPanel';
import TaskList from '@/components/TaskList';
import KanbanBoard from '@/components/KanbanBoard';
import TaskFilterBar from '@/components/TaskFilterBar';
import AssigneeSelector from '@/components/AssigneeSelector';
import SlaDashboard from '@/components/SlaDashboard';
import { TaskInspector } from '@/features/tasks';
import {
  Calendar,
  ChevronDown,
  Edit3,
  FileText,
  Folder,
  Layout,
  List,
  MessageCircle,
  MessageSquare,
  Plus,
  Users,
  Trash2,
  History,
  RefreshCw,
  Calculator,
  Zap,
  Bot
} from 'lucide-react';
import { Note } from '@/types/note';
import { useDashboard, ALL_PROJECTS_VALUE } from '@/features/dashboard';

export function DashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const { tab } = useParams();
  const dash = useDashboard();

  const statusPillCls: Record<string, string> = {
    planned: 'bg-olive-500/20 text-olive-300',
    active: 'bg-amber-500/20 text-amber-300',
    completed: 'bg-emerald-500/20 text-emerald-300',
    archived: 'bg-olive-500/20 text-olive-400',
  };

  const allMutationMessages = [
    dash.taskMutationError,
    dash.taskMutationSuccess,
    dash.projectMutationError,
    dash.projectMutationSuccess,
    dash.epicMutationError,
    dash.epicMutationSuccess,
    dash.noteMutationError,
    dash.noteMutationSuccess,
    dash.error
  ].filter(Boolean);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-900 transition-colors duration-250">
      {/* Toast Notification */}
      {allMutationMessages.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
          {allMutationMessages.map((msg, i) => (
            <div
              key={i}
              className={`px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium animate-in fade-in slide-in-from-top-4 ${
                msg?.toLowerCase().includes('unable') || msg?.toLowerCase().includes('error')
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span>{msg}</span>
                <button
                  className="opacity-50 hover:opacity-100 transition-opacity"
                  onClick={() => {
                    dash.setTaskMutationError(null);
                    dash.setTaskMutationSuccess(null);
                    dash.setProjectMutationError(null);
                    dash.setProjectMutationSuccess(null);
                    dash.setEpicMutationError(null);
                    dash.setEpicMutationSuccess(null);
                    dash.setNoteMutationError(null);
                    dash.setNoteMutationSuccess(null);
                    dash.setError(null);
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
      <Sidebar
        activeView={dash.activeView}
        selectedProjectView={dash.selectedProjectView}
        allProjectsValue={ALL_PROJECTS_VALUE}
        onProjectSelect={dash.handleProjectSelect}
        onViewChange={(view: SidebarView, targetTab?: string) => {
          if (view === 'dashboard') navigate('/dashboard');
          else if (view === 'semantic-intelligence') navigate('/intelligence');
          else if (view === 'prompts') navigate('/prompts');
          else if (view === 'playground') navigate('/playground');
          else if (view === 'event-tracking') navigate('/event-tracking');
          else if (view === 'engagement') navigate('/engagement');
          else if (view === 'sdk-integrations') navigate('/sdk-integrations');
          else if (view === 'sdk-integration-detail') {
            if (dash.activeIntegrationName) {
              navigate(`/sdk-integrations/${dash.activeIntegrationName}/${targetTab || 'overview'}`);
            }
          } else if (view === 'sdk-docs') navigate('/sdk-docs');
          else if (view === 'settings') navigate('/settings');
        }}
        onNewProject={() => dash.setIsProjectCreateModalOpen(true)}
        onLogout={dash.logout}
        activeIntegrationId={dash.activeIntegrationName}
        activeIntegrationName={dash.activeIntegrationName}
        activeTab={tab || 'overview'}
      />

      {/* Right side wrapper */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <Topbar
          title={
            dash.activeView === 'settings'
              ? 'Settings'
              : dash.activeView === 'sdk-docs'
              ? 'SDK Documentation'
              : dash.activeView === 'event-tracking'
              ? 'Event Tracking'
              : dash.activeView === 'engagement'
              ? 'Engagement'
              : dash.activeView === 'prompts'
              ? 'Prompt Library'
              : dash.activeView === 'playground'
              ? 'Prompt Playground'
              : dash.activeView === 'sdk-integrations'
              ? 'SDK Integrations'
              : dash.activeView === 'semantic-intelligence'
              ? 'Semantic Intelligence'
              : dash.activeProject
              ? dash.activeProject.name
              : 'All Projects'
          }
          user={{ name: dash.user?.name || null, email: dash.user?.email || '' }}
          notifications={dash.notifications}
          isNotificationsOpen={dash.isNotificationsOpen}
          onNotificationsToggle={() => dash.setIsNotificationsOpen(!dash.isNotificationsOpen)}
          onNotificationsClose={() => dash.setIsNotificationsOpen(false)}
          onMarkAsRead={dash.handleMarkAsRead}
          onClearAll={dash.handleClearAll}
          onNotificationClick={dash.handleNotificationClick}
          breadcrumbs={
            <>
              <button
                onClick={() => dash.handleProjectSelect(ALL_PROJECTS_VALUE)}
                className="hover:text-slate-600 transition-colors"
                type="button"
              >
                Dashboard
              </button>

              <span className="text-slate-300">/</span>

              {dash.activeView === 'settings' ? (
                <span className="text-slate-600">Settings</span>
              ) : dash.activeView === 'sdk-docs' ? (
                <span className="text-slate-600">SDK Documentation</span>
              ) : dash.activeView === 'event-tracking' ? (
                <span className="text-slate-600">Event Tracking</span>
              ) : dash.activeView === 'engagement' ? (
                <span className="text-slate-600">Engagement</span>
              ) : dash.activeView === 'sdk-integrations' ? (
                <span className="text-slate-600">SDK Integrations</span>
              ) : dash.activeView === 'sdk-integration-detail' ? (
                <>
                  <button
                    onClick={() => navigate('/sdk-integrations')}
                    className="hover:text-slate-600 transition-colors"
                    type="button"
                  >
                    SDK Integrations
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-600">Integration Detail</span>
                </>
              ) : dash.activeView === 'prompts' ? (
                <span className="text-slate-600">Prompt Library</span>
              ) : dash.activeView === 'playground' ? (
                <span className="text-slate-600">Prompt Playground</span>
              ) : dash.activeView === 'semantic-intelligence' ? (
                <span className="text-slate-600">Semantic Intelligence</span>
              ) : dash.activeProject ? (
                <>
                  <button
                    onClick={() => dash.handleProjectSelect(ALL_PROJECTS_VALUE)}
                    className="hover:text-slate-600 transition-colors"
                    type="button"
                  >
                    Projects
                  </button>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-600">{dash.activeProject.name}</span>
                  {dash.activeProjectAiEnabled ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200/50 uppercase tracking-wider font-bold text-[9px] select-none ml-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      AI ({dash.activeProjectAiProvider ? dash.activeProjectAiProvider.toUpperCase() : ''})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200/50 uppercase tracking-wider font-bold text-[9px] select-none ml-1.5">
                      AI (FALLBACK)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-olive-600">All Projects</span>
              )}
            </>
          }
          rightContent={
            <div className="flex items-center gap-3">
              <InvitationNotificationPanel />
              {dash.activeView !== 'settings' && (
                <div className="mr-2">
                  <DateNavigator date={dash.selectedDate} disabled={dash.loading} onChange={dash.setSelectedDate} />
                </div>
              )}
            </div>
          }
        />

        {/* Main View Area */}
        <main className="flex-1 overflow-hidden">
          {dash.activeView === 'settings' ? (
            <div className="h-full overflow-y-auto">
              <div className="px-8 py-6 border-b border-olive-200 bg-white/60">
                <h3 className="text-xl font-semibold text-olive-950 m-0">Settings</h3>
                <p className="text-olive-500 m-0 text-sm mt-0.5">Account &amp; Preferences</p>
              </div>
              <div className="p-8">
                <SettingsPanel
                  projects={dash.projects}
                  activeProject={dash.activeProject}
                  onAiConfigChange={(enabled, provider) => {
                    dash.setActiveProjectAiEnabled(enabled);
                    dash.setActiveProjectAiProvider(provider);
                  }}
                />
              </div>
            </div>
          ) : dash.activeView === 'event-tracking' ? (
            <div className="h-full overflow-y-auto">
              <EventTrackingPage onOpenDocs={() => navigate('/sdk-docs')} />
            </div>
          ) : dash.activeView === 'engagement' ? (
            <div className="h-full overflow-y-auto">
              <EngagementPage />
            </div>
          ) : dash.activeView === 'sdk-integrations' ? (
            <div className="h-full overflow-y-auto">
              <SdkIntegrationsPage />
            </div>
          ) : dash.activeView === 'sdk-integration-detail' ? (
            <div className="h-full overflow-y-auto">
              <SdkIntegrationDetailPage />
            </div>
          ) : dash.activeView === 'prompts' ? (
            <div className="h-full overflow-y-auto bg-slate-950">
              <PromptLibraryPage workspaceId={dash.activeWorkspaceId} />
            </div>
          ) : dash.activeView === 'playground' ? (
            <div className="h-full overflow-y-auto">
              <PromptPlaygroundPage workspaceId={dash.activeWorkspaceId} />
            </div>
          ) : dash.activeView === 'semantic-intelligence' ? (
            <div className="h-full overflow-y-auto">
              <SemanticIntelligencePage
                allProjectsValue={ALL_PROJECTS_VALUE}
                projects={dash.projects}
                selectedProjectId={dash.selectedProjectView}
              />
            </div>
          ) : dash.activeView === 'sdk-docs' ? (
            <div className="h-full overflow-y-auto">
              <div className="px-8 py-6 border-b border-olive-200 bg-white/60">
                <h3 className="text-xl font-semibold text-olive-950 m-0">SDK Documentation</h3>
                <p className="text-olive-500 m-0 text-sm mt-0.5">Integration Guide &amp; API Reference</p>
              </div>
              <div className="p-3">
                <SdkDocsPanel />
              </div>
            </div>
          ) : !dash.activeProject ? (
            <div className="h-full overflow-y-auto">
              <ProjectPanel
                actionProjectId={dash.actionProjectId}
                currentPage={dash.projectPage}
                loading={dash.loading}
                onDeleteProject={dash.handleDeleteProject}
                onDeleteProjects={dash.handleDeleteProjects}
                onOpenCreateProject={() => dash.setIsProjectCreateModalOpen(true)}
                onOpenEpicManager={(project) => {
                  dash.handleProjectSelect(project.id);
                }}
                onOpenProject={(projId) => {
                  dash.handleProjectSelect(projId ?? ALL_PROJECTS_VALUE);
                }}
                onOpenUpdateProject={(project) => {
                  dash.setEditingProject(project);
                }}
                projects={dash.projects}
                totalPages={dash.projectTotalPages}
                onPageChange={dash.handleProjectPageChange}
                onSearch={dash.handleProjectSearch}
                searchTerm={dash.projectSearchTerm}
              />
            </div>
          ) : (
            /* 3-column workspace */
            <div className="flex flex-col h-full overflow-hidden bg-white">
              <div className="shrink-0 px-6 py-5 border-b border-olive-200/80 bg-white/78">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-olive-600 text-white shadow-lg shadow-olive-500/25 shrink-0">
                      <Folder size={20} />
                    </div>
                    <div className="grid gap-1">
                      <div className="relative flex items-center">
                        <select
                          className="appearance-none bg-transparent border-none text-[1.35rem] font-bold text-olive-950 focus:outline-none focus:ring-0 cursor-pointer pr-6 m-0 p-0 tracking-tight"
                          onChange={(e) => dash.handleProjectSelect(e.target.value)}
                          value={dash.activeProject.id}
                        >
                          {dash.projects.map((project) => (
                            <option
                              className="text-olive-950 bg-white text-base font-normal"
                              key={project.id}
                              value={project.id}
                            >
                              {project.name}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                          <ChevronDown className="text-olive-500" size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-olive-700 border border-olive-700 rounded-lg text-sm font-semibold text-white hover:bg-olive-800 shadow-sm transition-colors"
                      onClick={() => dash.setIsAiPlanningWorkspaceOpen(true)}
                      type="button"
                    >
                      <Zap size={16} />
                      AI Planner
                    </button>
                    <button
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-olive-200 rounded-lg text-sm font-medium text-olive-600 hover:bg-olive-50 shadow-sm transition-colors"
                      onClick={() => dash.setActiveView('settings')}
                      type="button"
                    >
                      <Bot size={16} />
                      AI Settings
                    </button>
                    <button
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-olive-200 rounded-lg text-sm font-medium text-olive-600 hover:bg-olive-50 shadow-sm transition-colors"
                      onClick={() => dash.handleOpenProjectNotesPanel(dash.activeProject!)}
                      type="button"
                    >
                      <MessageSquare size={16} />
                      Project Notes
                    </button>
                    <button
                      className={[
                        'flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-bold shadow-sm transition-all duration-300 transform active:scale-95',
                        dash.isChatPanelOpen
                          ? 'bg-gradient-to-r from-olive-600 to-olive-600 border-olive-600 text-white shadow-olive-500/25'
                          : 'bg-white border-olive-200 text-olive-600 hover:border-olive-400 hover:text-olive-600'
                      ].join(' ')}
                      onClick={() => dash.setIsChatPanelOpen(!dash.isChatPanelOpen)}
                      type="button"
                    >
                      <MessageCircle size={18} className={dash.isChatPanelOpen ? 'text-white' : 'text-olive-500'} />
                      Chat
                    </button>
                    <button
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-olive-200 rounded-lg text-sm font-medium text-olive-600 hover:bg-olive-50 shadow-sm transition-colors"
                      onClick={() => dash.setIsProjectTeamModalOpen(true)}
                      type="button"
                    >
                      <Users size={16} />
                      Team
                    </button>
                    <button
                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-olive-200 rounded-lg text-sm font-medium text-olive-600 hover:bg-olive-50 shadow-sm transition-colors"
                      onClick={() => dash.setIsActivityHistoryOpen(true)}
                      type="button"
                    >
                      <History size={16} />
                      History
                    </button>
                    <button
                      className="group flex items-center gap-2 px-3.5 py-2.5 bg-white border border-olive-200 rounded-lg text-sm font-medium text-olive-600 hover:bg-olive-50 shadow-sm transition-colors disabled:opacity-50"
                      disabled={dash.isRecalculatingPriorities}
                      onClick={() => void dash.handleRecalculatePriorities()}
                      type="button"
                    >
                      <Calculator size={16} className={dash.isRecalculatingPriorities ? "animate-pulse text-olive-800" : ""} />
                      {dash.isRecalculatingPriorities ? 'Recalculating...' : 'Recalculate Priority'}
                    </button>
                    <button
                      className="group flex items-center gap-2 px-3.5 py-2.5 bg-white border border-olive-200 rounded-lg text-sm font-medium text-olive-600 hover:bg-olive-50 shadow-sm transition-colors disabled:opacity-50"
                      onClick={() => void dash.loadDashboard()}
                      type="button"
                    >
                      <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-1 min-h-0 overflow-hidden gap-4 p-4 bg-olive-50">
                {/* Column 1 — Epics (Sidebar) */}
                <div className={`flex flex-col shrink-0 h-full rounded-md border border-olive-200/60 bg-white/70 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-500 ease-in-out ${dash.isSidebarCollapsed ? 'w-14' : 'w-[300px]'}`}>
                  <div className={`flex items-center justify-between px-5 py-6 border-b border-olive-100 bg-linear-to-b from-white/50 to-transparent ${dash.isSidebarCollapsed ? 'flex-col gap-4' : ''}`}>
                    {!dash.isSidebarCollapsed && (
                      <div className="animate-in fade-in duration-500">
                        <span className="text-[0.6rem] uppercase tracking-[0.2em] font-black text-olive-600 opacity-80">Infrastructure</span>
                        <h3 className="text-[1rem] font-bold font-sans text-olive-950 m-0 mt-1 tracking-tight">Epics</h3>
                      </div>
                    )}
                    <div className={`flex items-center gap-1.5 ${dash.isSidebarCollapsed ? 'flex-col' : ''}`}>
                      {!dash.isSidebarCollapsed && (
                        <button
                          className="flex items-center justify-center w-9 h-9 bg-olive-900 hover:bg-olive-800 text-white rounded-lg shadow-sm transition-all active:scale-95 disabled:opacity-40"
                          disabled={!dash.canManageActiveProject}
                          onClick={() => dash.setIsEpicCreateModalOpen(true)}
                          title="New Epic"
                          type="button"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                      <button
                        className="flex items-center justify-center w-9 h-9 hover:bg-olive-100 text-olive-400 hover:text-olive-600 rounded-lg transition-all"
                        onClick={() => dash.setIsSidebarCollapsed(!dash.isSidebarCollapsed)}
                        title={dash.isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                      >
                        {dash.isSidebarCollapsed ? <Layout size={18} /> : <List size={18} />}
                      </button>
                    </div>
                  </div>

                  {!dash.isSidebarCollapsed && (
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar animate-in fade-in slide-in-from-left-4 duration-500">
                      {dash.activeProjectEpics.map(epic => {
                        const isActive = dash.selectedEpicId === epic.id;
                        return (
                          <div
                            key={epic.id}
                            className={`relative flex flex-col gap-3 p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                              isActive
                                ? 'bg-olive-50/80 border-olive-400/60 ring-1 ring-olive-500/10'
                                : 'bg-white/50 border-olive-200/80 hover:border-olive-300 hover:-translate-y-[2px]'
                            }`}
                            onClick={() => dash.handleEpicSelect(isActive ? null : epic.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <h4 className={`text-[0.9rem] font-bold m-0 leading-tight transition-colors text-olive-950`}>
                                {epic.name}
                              </h4>
                              <span className={`shrink-0 text-[0.55rem] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${statusPillCls[epic.status] ?? 'bg-olive-100 text-olive-600 border-olive-200'}`}>
                                {epic.status}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 mt-1 opacity-60 hover:opacity-100 transition-opacity">
                              <button
                                className="p-1 rounded hover:bg-olive-100 text-olive-400 hover:text-olive-600 transition-colors"
                                onClick={(e) => { e.stopPropagation(); dash.handleOpenEpicNotesPanel(epic); }}
                                title="Notes"
                              >
                                <FileText size={12} />
                              </button>
                              <button
                                className="p-1 rounded hover:bg-olive-100 text-olive-400 hover:text-olive-600 transition-colors disabled:opacity-40"
                                disabled={!dash.canManageActiveProject}
                                onClick={(e) => { e.stopPropagation(); dash.setEditingEpic(epic); }}
                                title="Edit"
                              >
                                <Edit3 size={12} />
                              </button>
                              <div className="flex-1" />
                              <button
                                className="p-1 rounded hover:bg-red-50 text-olive-400 hover:text-red-500 transition-colors disabled:opacity-40"
                                disabled={dash.actionEpicId === epic.id || dash.activeProject?.currentUserRole !== 'ADMIN'}
                                onClick={(e) => { e.stopPropagation(); void dash.handleDeleteEpic(epic.id); }}
                                title="Delete"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {dash.activeProjectEpics.length === 0 && (
                        <div className="py-10 text-center opacity-40">
                          <EmptyState description="Create an epic to group your tasks." icon={List} title="No epics" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Column 2 — Main Workspace (Tasks) */}
                <div className={`flex flex-col flex-1 min-w-0 h-full rounded-md border border-olive-200/60 bg-white/50 backdrop-blur-xl shadow-md overflow-hidden transition-[opacity,filter,background-color] duration-500 ${!dash.selectedEpicId ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                  {dash.selectedEpicId ? (
                    <>
                      <div className="flex items-center justify-between px-6 py-6 border-b border-olive-100 bg-linear-to-b from-white/50 to-transparent">
                        <div>
                          <span className="text-[0.6rem] uppercase tracking-[0.2em] font-black text-olive-600 opacity-80">Execution</span>
                          <h3 className="text-[1.1rem] font-bold font-sans text-olive-950 m-0 mt-1 tracking-tight">{dash.tasksHeading}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-olive-500 text-[0.78rem] truncate max-w-[200px]">
                              {dash.epics.find(e => e.id === dash.selectedEpicId)?.name}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-olive-300" />
                            <span className="text-[0.7rem] font-bold text-olive-600">
                              {dash.activeEpicTasks.length} {dash.activeEpicTasks.length === 1 ? 'Task' : 'Tasks'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex bg-olive-100 p-1 rounded-lg border border-olive-200/50">
                            <button
                              onClick={() => dash.setViewMode('list')}
                              className={`p-1.5 rounded-md transition-all ${dash.viewMode === 'list' ? 'bg-white shadow-sm text-olive-600' : 'text-olive-400 hover:text-olive-600'}`}
                              title="List View"
                            >
                              <List size={18} />
                            </button>
                            <button
                              onClick={() => dash.setViewMode('kanban')}
                              className={`p-1.5 rounded-md transition-all ${dash.viewMode === 'kanban' ? 'bg-white shadow-sm text-olive-600' : 'text-olive-400 hover:text-olive-600'}`}
                              title="Kanban Board"
                            >
                              <Layout size={18} />
                            </button>
                          </div>
                          <button
                            className="flex items-center justify-center w-10 h-10 bg-olive-900 hover:bg-olive-800 text-white rounded-lg shadow-sm transition-all duration-300 hover:scale-[1.03] active:scale-95 disabled:opacity-40"
                            disabled={!dash.canManageActiveProject}
                            onClick={() => {
                              const activeEpic = dash.epics.find(e => e.id === dash.selectedEpicId);
                              dash.setTaskModalProjectId(activeEpic?.projectId ?? dash.activeProject?.id ?? null);
                              dash.setIsTaskCreateModalOpen(true);
                            }}
                            title="New Task"
                            type="button"
                          >
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="px-6 py-2 border-b border-olive-50">
                        <div className="mb-3">
                          <SlaDashboard />
                        </div>
                        <TaskFilterBar
                          filters={dash.taskFilters}
                          onFilterChange={dash.setTaskFilters}
                          members={dash.activeProjectMembers}
                          onClear={dash.handleClearFilters}
                        />
                      </div>

                      {dash.selectedTaskIds.length > 0 && (
                        <div className="mx-6 my-2 p-3 bg-olive-50/50 border border-olive-100 rounded-xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-olive-900">
                              {dash.selectedTaskIds.length} tasks selected
                            </span>
                            <button
                              onClick={() => dash.setSelectedTaskIds([])}
                              className="text-xs text-olive-600 hover:text-red-500 font-medium transition-colors underline decoration-dotted"
                            >
                              Deselect all
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-olive-500 uppercase tracking-widest">Assign to:</span>
                            <AssigneeSelector
                              projectId={dash.activeProject?.id ?? null}
                              selectedUserId=""
                              onSelect={(userId) => void dash.handleBulkAssign(userId)}
                              className="w-48"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex-1 overflow-auto custom-scrollbar">
                        {dash.viewMode === 'list' ? (
                          <div className="p-6">
                            <TaskList
                              actionTaskId={dash.actionTaskId}
                              epics={dash.epics}
                              onDelete={(taskId) => {
                                const task = dash.tasks.find(t => t.id === taskId);
                                void dash.handleDeleteTask(taskId, task?.title ?? 'this task');
                              }}
                              onEditTask={(task) => dash.setEditingTask(task)}
                              onUpdateStatus={(task, status) => void dash.handleUpdateTaskStatus(task, status)}
                              onUpdateEpic={(task, epicId) => void dash.handleUpdateTaskEpic(task, epicId)}
                              projects={dash.projects}
                              tasks={dash.activeEpicTasks}
                              onSelectTask={(task) => dash.setSelectedTaskId(task.id)}
                              onCommentTask={(task) => {
                                dash.setSelectedTaskId(task.id);
                                dash.setSidePanelTab('comments');
                              }}
                              onToggleBlocked={(task) => void dash.handleToggleBlocked(task)}
                              selectedTaskId={dash.selectedTaskId}
                              selectedTaskIds={dash.selectedTaskIds}
                              onToggleSelection={dash.handleToggleTaskSelection}
                              loading={dash.loading && dash.tasks.length === 0}
                            />
                            {!dash.loading && dash.activeEpicTasks.length === 0 && (
                              <div className="py-20 flex flex-col items-center opacity-30">
                                <EmptyState description="No tasks scheduled for this epic." icon={Calendar} title="Empty Workspace" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-full">
                            <KanbanBoard
                              tasks={dash.activeEpicTasks}
                              onUpdateStatus={async (taskId, status) => {
                                const task = dash.tasks.find(t => t.id === taskId);
                                if (task) await dash.handleUpdateTaskStatus(task, status, true);
                              }}
                              onSelectTask={(task) => dash.setSelectedTaskId(task.id)}
                              onCommentTask={(task) => {
                                dash.setSelectedTaskId(task.id);
                                dash.setSidePanelTab('comments');
                              }}
                              onToggleBlocked={(task) => void dash.handleToggleBlocked(task)}
                              onDeleteTask={(taskId) => {
                                const task = dash.tasks.find(t => t.id === taskId);
                                void dash.handleDeleteTask(taskId, task?.title ?? 'this task');
                              }}
                              onEditTask={(task) => dash.setEditingTask(task)}
                              loading={dash.loading && dash.tasks.length === 0}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center opacity-40">
                      <div className="p-6 rounded-full bg-olive-100 mb-4">
                        <Folder size={48} className="text-olive-400" />
                      </div>
                      <h4 className="text-lg font-bold text-olive-950">Select an Epic</h4>
                      <p className="text-sm text-olive-500 max-w-xs mt-2">Choose an epic from the sidebar to view its execution plan and tasks.</p>
                    </div>
                  )}
                </div>

                {/* Column 3 — Task Inspector */}
                <TaskInspector
                  isOpen={Boolean(dash.selectedTaskId && dash.activeTask)}
                  onClose={() => dash.setSelectedTaskId(null)}
                  task={dash.activeTask}
                  members={dash.activeProjectMembers}
                  actionTaskId={dash.actionTaskId}
                  sidePanelTab={dash.sidePanelTab}
                  setSidePanelTab={dash.setSidePanelTab}
                  editingSubtask={dash.editingSubtask}
                  setEditingSubtask={dash.setEditingSubtask}
                  setSubtaskModalTask={dash.setSubtaskModalTask}
                  handleUpdateSubtaskStatus={dash.handleUpdateSubtaskStatus}
                  handleUpdateSubtask={dash.handleUpdateSubtask}
                  handleDeleteSubtask={dash.handleDeleteSubtask}
                  handleOpenSubtaskNote={dash.handleOpenSubtaskNote}
                  handleToggleBlocked={dash.handleToggleBlocked}
                  handleEvaluatePriority={dash.handleEvaluatePriority}
                  isEvaluatingPriority={dash.isEvaluatingPriority}
                  handleOpenTaskNote={dash.handleOpenTaskNote}
                  handleUpdateTaskField={async (taskId, updates) => {
                    const task = dash.tasks.find(t => t.id === taskId);
                    if (task) {
                      await dash.handleUpdateTask({
                        title: updates.title ?? task.title,
                        description: updates.description ?? task.description,
                        note: updates.note ?? task.note,
                        date: updates.date ?? task.date,
                        status: (updates.status ?? (task.status === 'rolled_over' ? 'planned' : task.status)) as TaskWorkflowStatus,
                        priority: updates.priority ?? task.priority,
                        isBlocked: updates.isBlocked ?? task.isBlocked,
                        blockedByTaskId: updates.blockedByTaskId ?? task.blockedByTaskId,
                        projectId: updates.projectId !== undefined ? updates.projectId : (task.projectId || null),
                        epicId: updates.epicId !== undefined ? updates.epicId : (task.epicId || null),
                        assignedTo: updates.assignedTo,
                      });
                    }
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      {dash.isProjectCreateModalOpen && (
        <Modal onClose={() => dash.setIsProjectCreateModalOpen(false)} title="Create Project">
          <ProjectForm onSubmit={dash.handleCreateProject} />
        </Modal>
      )}
      {dash.isAiPlanningWorkspaceOpen && (
        <AiProjectPlanModal
          isOpen={dash.isAiPlanningWorkspaceOpen}
          onClose={() => dash.setIsAiPlanningWorkspaceOpen(false)}
          onProjectCreated={() => {
            dash.setIsAiPlanningWorkspaceOpen(false);
            void dash.loadDashboard();
          }}
        />
      )}
      {dash.isChatPanelOpen && dash.activeProject && (
        <>
          <div
            className="fixed inset-0 bg-olive-900/20 backdrop-blur-[2px] z-[2000] animate-in fade-in duration-300"
            onClick={() => dash.setIsChatPanelOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full md:w-1/2 lg:max-w-1/2 bg-white z-[5001] shadow-2xl animate-in slide-in-from-right duration-500 overflow-hidden border-l border-olive-200 flex flex-col">
            <ChatPanel
              project={dash.activeProject}
              members={dash.activeProjectMembers}
              isOpen={dash.isChatPanelOpen}
              onClose={() => dash.setIsChatPanelOpen(false)}
            />
          </div>
        </>
      )}
      {dash.editingProject && (
        <Modal onClose={() => dash.setEditingProject(null)} title="Update Project">
          <ProjectForm initialDescription={dash.editingProject.description} initialName={dash.editingProject.name} onSubmit={dash.handleUpdateProject} submitLabel="Update project" />
        </Modal>
      )}
      {dash.isEpicCreateModalOpen && dash.activeProject && (
        <Modal onClose={() => dash.setIsEpicCreateModalOpen(false)} title={`Create Epic for ${dash.activeProject.name}`}>
          <EpicForm onSubmit={dash.handleCreateEpic} submitLabel="Create epic" />
        </Modal>
      )}
      {dash.editingEpic && dash.activeProject && (
        <Modal onClose={() => dash.setEditingEpic(null)} title={`Update Epic for ${dash.activeProject.name}`}>
          <EpicForm
            initialDescription={dash.editingEpic.description}
            initialName={dash.editingEpic.name}
            initialStatus={dash.editingEpic.status}
            onSubmit={dash.handleUpdateEpic}
            submitLabel="Update epic"
          />
        </Modal>
      )}
      {dash.isTaskCreateModalOpen && (
        <Modal onClose={() => dash.setIsTaskCreateModalOpen(false)} title="Create Task">
          <AddTaskForm
            epics={dash.epics}
            initialProjectId={dash.taskModalProjectId}
            initialEpicId={dash.selectedEpicId}
            onCreateTask={dash.handleCreateTask}
            projects={dash.projects}
          />
        </Modal>
      )}
      {dash.isProjectTeamModalOpen && dash.activeProject && (
        <Modal
          bodyClassName="!p-0"
          onClose={() => dash.setIsProjectTeamModalOpen(false)}
          panelClassName="!max-w-[820px]"
          title={`Team for ${dash.activeProject.name}`}
        >
          <ProjectTeamPanel
            canManageTeam={dash.canManageTeam}
            currentUserId={dash.user?.id ?? null}
            isMutating={dash.teamMutationLoading}
            members={dash.activeProjectMembers}
            projectId={dash.activeProject.id}
            onInviteMember={dash.handleInviteProjectMember}
            onRemoveMember={dash.handleRemoveProjectMember}
            onLeaveProject={dash.handleLeaveProject}
          />
        </Modal>
      )}
      {dash.isActivityHistoryOpen && dash.activeProject && (
        <Modal
          bodyClassName="!p-0"
          onClose={() => dash.setIsActivityHistoryOpen(false)}
          panelClassName="!max-w-[720px]"
          title={`Activity History — ${dash.activeProject.name}`}
        >
          <ActivityHistoryPanel
            projectId={dash.activeProject.id}
            projectName={dash.activeProject.name}
          />
        </Modal>
      )}
      {dash.isProjectNotesModalOpen && dash.activeProjectForNotes && (
        <Modal onClose={() => dash.setIsProjectNotesModalOpen(false)} title={dash.activeProjectNotesModalTitle}>
          <ProjectNotes
            actionNoteId={dash.actionNoteId}
            heading="Project notes"
            loading={dash.notesLoadingKey === `project:${dash.activeProjectForNotes.id}`}
            notes={dash.activeProjectNotes}
            onCreateNote={() => dash.activeProjectForNotes && dash.handleOpenCreateProjectNote(dash.activeProjectForNotes)}
            onDeleteNote={dash.activeProjectForNotes.currentUserRole === 'ADMIN' ? (note) => void dash.handleDeleteNote(note) : undefined}
            onOpenNote={(note) => void dash.handleOpenExistingNote(note)}
          />
        </Modal>
      )}
      {dash.isEpicNotesModalOpen && dash.activeEpicForNotes && (
        <Modal onClose={() => dash.setIsEpicNotesModalOpen(false)} title={dash.activeEpicNotesModalTitle}>
          <ProjectNotes
            actionNoteId={dash.actionNoteId}
            createLabel="Create epic note"
            emptyDescription="Create the first note to capture decisions, references, or follow-ups for this epic."
            emptyTitle="No epic notes yet"
            heading="Epic notes"
            loading={dash.notesLoadingKey === `epic:${dash.activeEpicForNotes.id}`}
            notes={dash.activeEpicNotes}
            onCreateNote={dash.projects.find((project) => project.id === dash.activeEpicForNotes?.projectId)?.currentUserRole === 'ADMIN' ? () => dash.handleOpenCreateEpicNote(dash.activeEpicForNotes!) : undefined}
            onDeleteNote={dash.projects.find((project) => project.id === dash.activeEpicForNotes?.projectId)?.currentUserRole === 'ADMIN' ? (note) => void dash.handleDeleteNote(note) : undefined}
            onOpenNote={(note) => void dash.handleOpenExistingNote(note)}
          />
        </Modal>
      )}
      {dash.editingTask && (
        <Modal onClose={() => dash.setEditingTask(null)} title={`Edit Task: ${dash.editingTask.title}`}>
          <EditTaskForm
            epics={dash.epics}
            allTasks={dash.tasks}
            onSubmit={dash.handleUpdateTask}
            projects={dash.projects}
            task={dash.editingTask}
          />
        </Modal>
      )}
      {dash.subtaskModalTask && (
        <Modal
          onClose={() => dash.setSubtaskModalTask(null)}
          title={`Create Subtask for ${dash.subtaskModalTask.title}`}
        >
          <SubtaskForm members={dash.activeProjectMembers} onSubmit={dash.handleCreateSubtask} />
        </Modal>
      )}
      {dash.activeNoteEditor && (
        <NoteModal
          allowAppend={(dash.activeNoteEditor.kind === 'project' || dash.activeNoteEditor.kind === 'epic') && dash.activeNoteEditor.note != null}
          allowDelete={
            dash.activeNoteEditor.kind === 'project' || dash.activeNoteEditor.kind === 'epic'
              ? dash.activeNoteEditor.note != null
              : dash.activeNoteEditor.kind === 'task'
              ? Boolean(dash.activeNoteEditor.task.note?.trim())
              : Boolean(dash.activeNoteEditor.subtask.note?.trim())
          }
          deleteLabel={
            dash.activeNoteEditor.kind === 'project'
              ? 'Delete Note'
              : dash.activeNoteEditor.kind === 'epic'
              ? 'Delete Epic Note'
              : dash.activeNoteEditor.kind === 'task'
              ? 'Delete Task Note'
              : 'Delete Sub-task Note'
          }
          entityLabel={
            dash.activeNoteEditor.kind === 'project'
              ? dash.activeNoteEditor.projectName
              : dash.activeNoteEditor.kind === 'epic'
              ? dash.activeNoteEditor.epicName
              : dash.activeNoteEditor.kind === 'task'
              ? dash.activeNoteEditor.task.title
              : `${dash.activeNoteEditor.task.title} / ${dash.activeNoteEditor.subtask.title}`
          }
          modalTitle={
            dash.activeNoteEditor.kind === 'project'
              ? dash.activeNoteEditor.note
                ? 'Edit Project Note'
                : 'Create Project Note'
              : dash.activeNoteEditor.kind === 'epic'
              ? dash.activeNoteEditor.note
                ? 'Edit Epic Note'
                : 'Create Epic Note'
              : dash.activeNoteEditor.kind === 'task'
              ? dash.activeNoteEditor.task.note?.trim()
                ? 'Edit Task Note'
                : 'Create Task Note'
              : dash.activeNoteEditor.subtask.note?.trim()
              ? 'Edit Sub-task Note'
              : 'Create Sub-task Note'
          }
          note={
            dash.activeNoteEditor.kind === 'project'
              ? dash.activeNoteEditor.note
              : dash.activeNoteEditor.kind === 'epic'
              ? dash.activeNoteEditor.note
              : dash.activeNoteEditor.kind === 'task'
              ? { title: '', content: dash.activeNoteEditor.task.note ?? '' }
              : { title: '', content: dash.activeNoteEditor.subtask.note ?? '' }
          }
          onClose={() => dash.setActiveNoteEditor(null)}
          onDelete={
            'note' in dash.activeNoteEditor && dash.activeNoteEditor.note
              ? () => void dash.handleDeleteNote((dash.activeNoteEditor as { note: Note }).note)
              : () => void dash.handleDeleteInlineNote()
          }
          onSave={dash.handleSaveNote}
          showTitle={dash.activeNoteEditor.kind === 'project' || dash.activeNoteEditor.kind === 'epic'}
          titlePlaceholder="Sprint recap"
        />
      )}
      {dash.priorityEvaluationModalOpen && dash.priorityEvaluationResult && (
        <Modal onClose={() => dash.setPriorityEvaluationModalOpen(false)} title="Priority Evaluation">
          <div className="grid gap-4">
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-olive-100">
                <span className="font-bold text-olive-700">Base Priority</span>
                <span className="text-olive-900 font-medium">{dash.priorityEvaluationResult.basePriority}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-olive-100">
                <span className="font-bold text-olive-700">Dynamic Priority</span>
                <span className="text-olive-900 font-bold px-2 py-0.5 bg-olive-100 rounded">{dash.priorityEvaluationResult.dynamicPriority}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-olive-100">
                <span className="font-bold text-olive-700">Dynamic Score</span>
                <span className="text-olive-900">{dash.priorityEvaluationResult.dynamicPriorityScore}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-olive-100">
                <span className="font-bold text-olive-700">Urgency / Impact</span>
                <span className="text-olive-900">{dash.priorityEvaluationResult.urgencyScore} / {dash.priorityEvaluationResult.impactScore}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-olive-100">
                <span className="font-bold text-olive-700">Downstream Impact</span>
                <span className="text-olive-900">{dash.priorityEvaluationResult.downstreamTaskCount} tasks ({dash.priorityEvaluationResult.dependencyWeight} weight)</span>
              </div>
            </div>
            <div className="bg-olive-50 p-3 rounded-lg border border-olive-200">
              <h4 className="text-xs font-bold text-olive-800 uppercase tracking-wider mb-1">Reasoning</h4>
              <p className="text-sm text-olive-600 m-0">{dash.priorityEvaluationResult.reason}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                className="px-4 py-2 bg-olive-900 text-white rounded-lg text-sm font-bold hover:bg-olive-800"
                onClick={() => dash.setPriorityEvaluationModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default DashboardPage;
