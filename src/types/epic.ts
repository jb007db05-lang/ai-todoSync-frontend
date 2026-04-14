export type EpicStatus = 'planned' | 'active' | 'completed' | 'archived';

export const EPIC_STATUS_OPTIONS: Array<{ value: EpicStatus; label: string }> = [
  { value: 'planned', label: 'Planned' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' }
];

export interface Epic {
  id: string;
  name: string;
  description?: string;
  projectId: string;
  status: EpicStatus;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEpicInput {
  name: string;
  description?: string;
  status?: EpicStatus;
}

export interface UpdateEpicInput {
  name?: string;
  description?: string;
  status?: EpicStatus;
}
