import api from '@/services/api';
import type { TaskPriority } from '@/types/task';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalAction =
  | 'PRIORITY_CHANGE'
  | 'DYNAMIC_PRIORITY_ESCALATION'
  | 'RETENTION_POLICY_CHANGE'
  | 'LEGAL_HOLD_CHANGE';

export interface ApprovalWorkflow {
  id: string;
  projectId: string;
  taskId: string | null;
  requestedBy: string;
  action: ApprovalAction;
  status: ApprovalStatus;
  payload: Record<string, unknown>;
  reason: string;
  signOffChain: Array<{
    order: number;
    approverUserId: string;
    status: ApprovalStatus;
    decidedAt: string | null;
    note: string;
  }>;
  completedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ApprovalListResponse {
  message: string;
  data: {
    approvals: ApprovalWorkflow[];
  };
}

interface ApprovalResponse {
  message: string;
  data: {
    approval: ApprovalWorkflow;
  };
}

const listApprovals = async (projectId: string): Promise<ApprovalWorkflow[]> => {
  const response = await api.get<ApprovalListResponse>('/approvals', { params: { projectId } });
  return response.data.data.approvals;
};

const createApproval = async (payload: {
  projectId: string;
  taskId?: string | null;
  action: ApprovalAction;
  reason?: string;
  approverUserIds: string[];
  payload?: { priority?: TaskPriority } & Record<string, unknown>;
}): Promise<ApprovalWorkflow> => {
  const response = await api.post<ApprovalResponse>('/approvals', payload);
  return response.data.data.approval;
};

const decideApproval = async (
  approvalId: string,
  payload: { decision: 'APPROVED' | 'REJECTED'; note?: string }
): Promise<ApprovalWorkflow> => {
  const response = await api.patch<ApprovalResponse>(`/approvals/${approvalId}/decision`, payload);
  return response.data.data.approval;
};

export { createApproval, decideApproval, listApprovals };
