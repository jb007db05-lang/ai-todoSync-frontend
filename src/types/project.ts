export interface Project {
  id: string;
  name: string;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectInput {
  name: string;
}

export interface UpdateProjectInput {
  name?: string;
}
