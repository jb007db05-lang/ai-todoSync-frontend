import api from '@/services/api';

export interface PendingInvitation {
  id: string;
  token: string;
  projectId: string;
  projectName: string;
  inviterName: string;
  role: 'ADMIN' | 'MEMBER';
  status: string;
  createdAt?: string;
}

export interface ProjectInvitation {
  id: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  status: string;
  createdAt?: string;
}

export const getMyInvitations = async (): Promise<PendingInvitation[]> => {
  const res = await api.get<{ data: PendingInvitation[] }>('/invitations/me');
  return res.data.data;
};

export const getProjectInvitations = async (projectId: string): Promise<ProjectInvitation[]> => {
  const res = await api.get<{ data: ProjectInvitation[] }>(`/invitations/projects/${projectId}`);
  return res.data.data;
};

export const acceptInvitation = async (token: string): Promise<void> => {
  await api.post('/invitations/accept', { token });
};

export const rejectInvitation = async (token: string): Promise<void> => {
  await api.post('/invitations/reject', { token });
};

export const revokeInvitation = async (invitationId: string): Promise<void> => {
  await api.delete(`/invitations/${invitationId}`);
};

export const sendInvitation = async (
  projectId: string,
  email: string,
  role: 'ADMIN' | 'MEMBER',
): Promise<void> => {
  await api.post(`/invitations/projects/${projectId}`, { email, role });
};
