import api from '@/services/api';
import type { CreateProjectInput, Project, UpdateProjectInput } from '@/types/project';

interface ProjectListResponse {
  message: string;
  data: {
    projects: ProjectTreeNode[];
  };
}

interface ProjectResponse {
  message: string;
  data: {
    project: Project;
  };
}

const getProjects = async (): Promise<Project[]> => {
  const response = await api.get<ProjectListResponse>('/projects');
  return response.data.data.projects;
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

export { createProject, deleteProject, getProjects, updateProject };
