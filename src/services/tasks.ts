import api from '@/services/api';
import type { CreateTaskInput, Task, TaskSummary, UpdateTaskInput } from '@/types/task';

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

const getTasks = async (date?: string): Promise<Task[]> => {
  const response = await api.get<TaskListResponse>('/tasks', {
    params: date ? { date } : undefined
  });

  return response.data.data.tasks;
};

const getTaskSummary = async (date?: string): Promise<TaskSummary> => {
  const response = await api.get<TaskSummaryResponse>('/tasks/summary', {
    params: date ? { date } : undefined
  });

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

const assignTask = async (taskId: string, userId: string | null): Promise<Task> => {
  const response = await api.patch<TaskResponse>(`/tasks/${taskId}/assign`, { userId });
  return response.data.data.task;
};

const deleteTask = async (taskId: string): Promise<string> => {
  const response = await api.delete<DeleteTaskResponse>(`/tasks/${taskId}`);
  return response.data.data.taskId;
};

export { assignTask, createTask, deleteTask, getTaskSummary, getTasks, updateTask };
