export type AiPlanningDraftStatus = 'REVIEW' | 'EXECUTING' | 'EXECUTED' | 'REJECTED' | 'FAILED';

export interface AiPlanningContext {
  project: {
    id: string;
    name: string;
    description: string;
    currentUserRole: 'ADMIN' | 'MEMBER';
  };
  milestones: Array<{ id: string; name: string; description: string; status: string; order: number }>;
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    date: string;
    epicId: string | null;
    subtasks: Array<{ id: string; title: string; description: string; status: string }>;
  }>;
  notes: Array<{ id: string; title: string; content: string; parentType: string }>;
  team: Array<{ userId: string; role: 'ADMIN' | 'MEMBER'; name: string | null; email: string }>;
}

export interface AiPlanningSession {
  id: string;
  projectId: string;
  createdBy: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AiPlanningMessage {
  id: string;
  projectId: string;
  sessionId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string | null;
}

export interface AiPlanningDraft {
  id: string;
  projectId: string;
  sessionId: string;
  requestedBy: string;
  status: AiPlanningDraftStatus;
  plan: {
    documentationTitle: string;
    documentation: string;
    milestones: Array<{ name: string; description?: string }>;
    tasks: Array<{
      title: string;
      description?: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      date: string;
      milestoneIndex: number;
      subtasks: Array<{ title: string; description?: string }>;
    }>;
  };
  rejectionReason: string;
  failureReason: string;
  artifacts: { noteId?: string; epicIds?: string[]; taskIds?: string[] };
  approvedBy: string | null;
  rejectedBy: string | null;
  executedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AiPlanningWorkspace {
  session: AiPlanningSession;
  messages: AiPlanningMessage[];
  drafts: AiPlanningDraft[];
}

export interface ProjectAiConfig {
  enabled: boolean;
  provider: 'gemini' | 'openai' | 'anthropic';
  apiKey?: string;
  baseUrl?: string;
  modelName: string;
}
