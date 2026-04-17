import api from '@/services/api';
import type { CreateTaskInput, Task, TaskSummary, UpdateTaskInput, TaskWorkflowStatus } from '@/types/task';

interface TaskListResponse {
  message: string;
  data: {
    tasks: Task[];
  };
}

interface TaskResponse {
  message: string;
  data: {
    task: Task;
  };
}

interface DeleteTaskResponse {
  message: string;
  data: {
    taskId: string;
  };
}

interface TaskSummaryResponse {
  message: string;
  data: {
    summary: TaskSummary;
  };
}

const getTasks = async (date?: string, assigneeId?: string): Promise<Task[]> => {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (assigneeId) params.assigneeId = assigneeId;

  const response = await api.get<TaskListResponse>('/tasks', { params });
  return response.data.data.tasks;
};

const getTasksAssignedToMe = async (): Promise<Task[]> => {
  const response = await api.get<TaskListResponse>('/tasks/assigned');
  return response.data.data.tasks;
};

const getTaskSummary = async (date?: string, assigneeId?: string): Promise<TaskSummary> => {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (assigneeId) params.assigneeId = assigneeId;

  const response = await api.get<TaskSummaryResponse>('/tasks/summary', { params });
  return response.data.data.summary;
};

const createTask = async (payload: CreateTaskInput): Promise<Task> => {
  const response = await api.post<TaskResponse>('/tasks', payload);
  return response.data.data.task;
};

const updateTask = async (taskId: string, payload: UpdateTaskInput): Promise<Task> => {
  const response = await api.patch<TaskResponse>(`/tasks/${taskId}`, payload);
  return response.data.data.task;
};

const updateTaskStatus = async (taskId: string, status: TaskWorkflowStatus): Promise<Task> => {
  const response = await api.patch<TaskResponse>(`/tasks/${taskId}/status`, { status });
  return response.data.data.task;
};

const markTaskBlocked = async (taskId: string, blockedByTaskId?: string): Promise<Task> => {
  const response = await api.patch<TaskResponse>(`/tasks/${taskId}/block`, { blockedByTaskId });
  return response.data.data.task;
};

const unblockTask = async (taskId: string): Promise<Task> => {
  const response = await api.patch<TaskResponse>(`/tasks/${taskId}/unblock`);
  return response.data.data.task;
};

const assignTask = async (taskId: string, userId: string | null): Promise<Task> => {
  const response = await api.patch<TaskResponse>(`/tasks/${taskId}/assign`, { userId });
  return response.data.data.task;
};

const deleteTask = async (taskId: string): Promise<string> => {
  const response = await api.delete<DeleteTaskResponse>(`/tasks/${taskId}`);
  return response.data.data.taskId;
};

const bulkAssignTasks = async (taskIds: string[], userId: string): Promise<Task[]> => {
  const response = await api.post<TaskListResponse>('/tasks/bulk-assign', { taskIds, assignedTo: userId });
  return response.data.data.tasks;
};

export {
  assignTask,
  bulkAssignTasks,
  createTask,
  deleteTask,
  getTaskSummary,
  getTasks,
  getTasksAssignedToMe,
  updateTask,
  updateTaskStatus,
  markTaskBlocked,
  unblockTask
};
