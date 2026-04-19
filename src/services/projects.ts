import api from '@/services/api';
import type {
  CreateProjectInput,
  Project,
  ProjectMember,
  UpdateProjectInput
} from '@/types/project';

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

interface ProjectMembersResponse {
  message: string;
  data: {
    members: ProjectMember[];
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

const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
  const response = await api.get<ProjectMembersResponse>(`/projects/${projectId}/members`);
  return response.data.data.members;
};

const addProjectMember = async (projectId: string, userId: string): Promise<ProjectMember> => {
  const response = await api.post<{ message: string; data: { member: ProjectMember } }>(
    `/projects/${projectId}/members`,
    { userId }
  );
  return response.data.data.member;
};

const removeProjectMember = async (projectId: string, userId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}/members/${userId}`);
};

const leaveProject = async (projectId: string): Promise<void> => {
  await api.post(`/projects/${projectId}/leave`);
};

export {
  addProjectMember,
  createProject,
  deleteProject,
  deleteProjects,
  getProjectMembers,
  getProjects,
  leaveProject,
  removeProjectMember,
  updateProject
};
