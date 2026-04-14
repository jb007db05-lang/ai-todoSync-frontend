import api from '@/services/api';
import type { CreateProjectInput, Project, UpdateProjectInput } from '@/types/project';

export interface ProjectsPaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface ProjectListResponse {
  message: string;
  data: {
    projects: Project[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface ProjectResponse {
  message: string;
  data: {
    project: Project;
  };
}

const getProjects = async (params?: ProjectsPaginationParams): Promise<ProjectListResponse['data']> => {
  const response = await api.get<ProjectListResponse>('/projects', { params });
  return response.data.data;
};

const createProject = async (payload: CreateProjectInput): Promise<Project> => {
  const response = await api.post<ProjectResponse>('/projects', payload);
  return response.data.data.project;
};

const updateProject = async (projectId: string, payload: UpdateProjectInput): Promise<Project> => {
  const response = await api.patch<ProjectResponse>(`/projects/${projectId}`, payload);
  return response.data.data.project;
};

const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};

const deleteProjects = async (projectIds: string[]): Promise<void> => {
  await api.post('/projects/bulk-delete', { projectIds });
};

export { createProject, deleteProject, deleteProjects, getProjects, updateProject };
