export interface Note {
  id: string;
  entityType: 'project' | 'epic';
  parentType: 'project' | 'epic' | 'task' | 'subtask';
  parentId: string;
  projectId: string;
  epicId: string | null;
  title: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
}

export interface UpdateNoteInput {
  appendContent?: boolean;
  title?: string;
  content?: string;
}
