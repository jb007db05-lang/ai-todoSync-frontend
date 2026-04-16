import api from './api';

export interface ActivityLog {
  id: string;
  projectId: string;
  entityType: 'project' | 'epic' | 'task' | 'subtask' | 'note';
  entityId: string;
  entityName?: string;
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'status_changed' | 'member_added' | 'member_removed';
  userId: string;
  userName: string;
  changes: { field: string; oldValue?: string; newValue?: string }[];
  description: string;
  createdAt: string;
}

export interface ActivityLogResponse {
  activities: ActivityLog[];
  total: number;
  page: number;
  totalPages: number;
}

export async function getProjectActivities(
  projectId: string,
  params?: { page?: number; limit?: number; entityType?: string }
): Promise<ActivityLogResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());
  if (params?.entityType) query.set('entityType', params.entityType);

  const { data } = await api.get<ActivityLogResponse>(
    `/projects/${projectId}/activities?${query.toString()}`
  );
  return data;
}
