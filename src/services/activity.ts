import api from './api';

export interface ActivityLog {
  id: string;
  projectId: string;
  entityType: 'project' | 'epic' | 'task' | 'subtask' | 'note';
  entityId: string;
  entityName?: string;
  action: 'created' | 'updated' | 'deleted' | 'assigned' | 'status_changed' | 'member_added' | 'member_removed' | 'approved' | 'rejected' | 'escalated';
  userId: string;
  userName: string;
  changes: { field: string; oldValue?: string; newValue?: string }[];
  description: string;
  metadata: Record<string, unknown>;
  immutableHash: string;
  previousHash: string | null;
  sequence: number;
  retentionUntil: string | null;
  legalHold: boolean;
  approvalId: string | null;
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

export interface VerificationResult {
  valid: boolean;
  checked: number;
  failedSequence: number | null;
}

export async function verifyProjectAuditChain(projectId: string): Promise<VerificationResult> {
  const { data } = await api.get<{ data: { verification: VerificationResult } }>(
    `/projects/${projectId}/activities/verify-chain`
  );
  return data.data.verification;
}

export interface RetentionPolicy {
  retentionDays: number | null;
  legalHold: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export async function getRetentionPolicy(projectId: string): Promise<RetentionPolicy> {
  const { data } = await api.get<{ data: { policy: RetentionPolicy } }>(
    `/projects/${projectId}/activities/retention-policy`
  );
  return data.data.policy;
}

export async function updateRetentionPolicy(
  projectId: string,
  payload: { retentionDays: number | null; legalHold: boolean }
): Promise<RetentionPolicy> {
  const { data } = await api.patch<{ data: { policy: RetentionPolicy } }>(
    `/projects/${projectId}/activities/retention-policy`,
    payload
  );
  return data.data.policy;
}
