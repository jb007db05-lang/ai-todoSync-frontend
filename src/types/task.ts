export type TaskWorkflowStatus = 'pending' | 'in_progress' | 'in_review' | 'completed';
export type TaskStatus = TaskWorkflowStatus | 'rolled_over';
export type TaskSource = 'claude' | 'chatgpt' | 'gemini' | 'manual';

export const TASK_WORKFLOW_STATUS_OPTIONS: Array<{ value: TaskWorkflowStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'completed', label: 'Completed' }
];

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  note?: string;
  status: TaskWorkflowStatus;
  completed: boolean;
  completedAt: string | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  note?: string;
  date: string;
  status: TaskStatus;
  rolledOver: boolean;
  rolloverCount: number;
  source?: TaskSource;
  projectId: string | null;
  epicId: string | null;
  assignedToUserId: string | null;
  assignedToUser: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  subtasks: Subtask[];
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canAssign: boolean;
    canUpdate: boolean;
  };
}

export interface TaskSummary {
  total: number;
  pending: number;
  inProgress: number;
  inReview: number;
  completed: number;
  rolledOver: number;
  date?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  note?: string;
  date: string;
  status?: TaskStatus;
  source?: TaskSource;
  projectId?: string | null;
  epicId?: string | null;
  subtasks?: Array<{
    title: string;
    note?: string;
    status?: TaskWorkflowStatus;
    completedAt?: string | null;
  }>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  note?: string;
  date?: string;
  status?: TaskStatus;
  projectId?: string | null;
  epicId?: string | null;
  subtasks?: Array<{
    title: string;
    note?: string;
    status?: TaskWorkflowStatus;
    completedAt?: string | null;
  }>;
}
