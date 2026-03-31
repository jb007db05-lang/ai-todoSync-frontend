import type { Project } from '@/types/project';

export interface ProjectOption {
  id: string;
  label: string;
}

export const flattenProjectOptions = (projects: Project[]): ProjectOption[] =>
  projects.map((project) => ({
    id: project.id,
    label: project.name
  }));

export const flattenProjectLabels = (projects: Project[]): ProjectOption[] =>
  projects.map((project) => ({
    id: project.id,
    label: project.name
  }));

export const findProjectByName = (projects: Project[], name: string): Project | null => {
  const normalizedName = name.trim().toLowerCase();

  return projects.find((project) => project.name.trim().toLowerCase() === normalizedName) ?? null;
};
