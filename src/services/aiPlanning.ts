import api from '@/services/api';
import type {
  AiPlanningContext,
  AiPlanningDraft,
  AiPlanningMessage,
  AiPlanningSession,
  AiPlanningWorkspace,
  ProjectAiConfig
} from '@/types/aiPlanning';

interface ApiResponse<T> {
  message: string;
  data: T;
}

const basePath = (projectId: string): string => `/projects/${projectId}/ai-planning`;

export const getAiPlanningContext = async (projectId: string): Promise<AiPlanningContext> => {
  const response = await api.get<ApiResponse<{ context: AiPlanningContext }>>(`${basePath(projectId)}/context`);
  return response.data.data.context;
};

export const listAiPlanningSessions = async (projectId: string): Promise<AiPlanningSession[]> => {
  const response = await api.get<ApiResponse<{ sessions: AiPlanningSession[] }>>(`${basePath(projectId)}/sessions`);
  return response.data.data.sessions;
};

export const createAiPlanningSession = async (projectId: string, title?: string): Promise<AiPlanningSession> => {
  const response = await api.post<ApiResponse<{ session: AiPlanningSession }>>(`${basePath(projectId)}/sessions`, { title });
  return response.data.data.session;
};

export const getAiPlanningSession = async (projectId: string, sessionId: string): Promise<AiPlanningWorkspace> => {
  const response = await api.get<ApiResponse<{ workspace: AiPlanningWorkspace }>>(`${basePath(projectId)}/sessions/${sessionId}`);
  return response.data.data.workspace;
};

export const sendAiPlanningMessage = async (
  projectId: string,
  sessionId: string,
  content: string
): Promise<{ userMessage: AiPlanningMessage; assistantMessage: AiPlanningMessage }> => {
  const response = await api.post<ApiResponse<{ messages: { userMessage: AiPlanningMessage; assistantMessage: AiPlanningMessage } }>>(
    `${basePath(projectId)}/sessions/${sessionId}/messages`,
    { content }
  );
  return response.data.data.messages;
};

export const generateAiPlanningDraft = async (projectId: string, sessionId: string): Promise<AiPlanningDraft> => {
  const response = await api.post<ApiResponse<{ draft: AiPlanningDraft }>>(`${basePath(projectId)}/sessions/${sessionId}/drafts`);
  return response.data.data.draft;
};

export const approveAiPlanningDraft = async (projectId: string, draftId: string): Promise<AiPlanningDraft> => {
  const response = await api.post<ApiResponse<{ draft: AiPlanningDraft }>>(`${basePath(projectId)}/drafts/${draftId}/approve`);
  return response.data.data.draft;
};

export const rejectAiPlanningDraft = async (projectId: string, draftId: string, reason?: string): Promise<AiPlanningDraft> => {
  const response = await api.post<ApiResponse<{ draft: AiPlanningDraft }>>(`${basePath(projectId)}/drafts/${draftId}/reject`, { reason });
  return response.data.data.draft;
};

export const getProjectAiConfig = async (projectId: string): Promise<ProjectAiConfig> => {
  const response = await api.get<ApiResponse<{ settings: ProjectAiConfig }>>(`${basePath(projectId)}/settings`);
  return response.data.data.settings;
};

export const updateProjectAiConfig = async (projectId: string, config: ProjectAiConfig): Promise<ProjectAiConfig> => {
  const response = await api.put<ApiResponse<{ settings: ProjectAiConfig }>>(`${basePath(projectId)}/settings`, config);
  return response.data.data.settings;
};

export const testAiConnection = async (projectId: string, config: ProjectAiConfig): Promise<{ success: boolean; message?: string; error?: string }> => {
  const response = await api.post<ApiResponse<{ result: { success: boolean; message?: string; error?: string } }>>(`${basePath(projectId)}/test-connection`, config);
  return response.data.data.result;
};
