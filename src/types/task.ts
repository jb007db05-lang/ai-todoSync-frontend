export type TaskStatus = 'pending' | 'done' | 'rolled_over';
export type TaskSource = 'claude' | 'chatgpt' | 'gemini' | 'manual';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string;
  status: TaskStatus;
  rolledOver: boolean;
  rolloverCount: number;
  source?: TaskSource;
}

export interface TaskSummary {
  total: number;
  pending: number;
  done: number;
  rolledOver: number;
  date?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  date: string;
  status?: TaskStatus;
  source?: TaskSource;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  date?: string;
  status?: TaskStatus;
}
