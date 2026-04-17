export type TaskWorkflowStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE';
export type TaskStatus = TaskWorkflowStatus | 'rolled_over';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskSource = 'claude' | 'chatgpt' | 'gemini' | 'manual';

export const TASK_WORKFLOW_STATUS_OPTIONS: Array<{ value: TaskWorkflowStatus; label: string }> = [
  { value: 'BACKLOG', label: 'Backlog' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'DONE', label: 'Done' }
];

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  note?: string;
  status: TaskWorkflowStatus;
  completed: boolean;
  completedAt: string | null;
  assignedToUserId: string | null;
  assignedToUser: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  note?: string;
  date: string;
  status: TaskStatus;
  priority: TaskPriority;
  isBlocked: boolean;
  blockedByTaskId: string | null;
  order: number;
  rolledOver: boolean;
  rolloverCount: number;
  source?: TaskSource;
  projectId: string | null;
  epicId: string | null;
  assignedTo: {
    id: string;
    email: string;
    name: string | null;
    firstName?: string;
    lastName?: string;
  };
  assignedBy: {
    id: string;
    email: string;
    name: string | null;
    firstName?: string;
    lastName?: string;
  } | null;
  assignedAt: string;
  subtasks: Subtask[];
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canAssign: boolean;
    canUpdate: boolean;
    canReassign: boolean;
  };
}

export interface TaskSummary {
  total: number;
  backlog: number;
  todo: number;
  inProgress: number;
  inReview: number;
  blocked: number;
  done: number;
  rolledOver: number;
  date?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  note?: string;
  date: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  source?: TaskSource;
  projectId?: string | null;
  epicId?: string | null;
  assignedTo?: string;
  subtasks?: Array<{
    title: string;
    note?: string;
    status?: TaskWorkflowStatus;
    completedAt?: string | null;
    assignedToUserId?: string | null;
  }>;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  note?: string;
  date?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  isBlocked?: boolean;
  blockedByTaskId?: string | null;
  order?: number;
  projectId?: string | null;
  epicId?: string | null;
  assignedTo?: string;
  subtasks?: Array<{
    title: string;
    note?: string;
    status?: TaskWorkflowStatus;
    completedAt?: string | null;
    assignedToUserId?: string | null;
  }>;
}
