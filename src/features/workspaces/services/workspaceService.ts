import api from '@/services/api';
import type { Workspace, WorkspaceDetails, WorkspaceMember, WorkspaceRole, WorkspaceSettings } from '../types/workspace';

export const workspaceService = {
  async listWorkspaces(): Promise<Workspace[]> {
    const res = await api.get<{ workspaces: Workspace[] }>('/workspaces');
    return res.data.workspaces;
  },

  async createWorkspace(name: string, slug?: string): Promise<Workspace> {
    const res = await api.post<{ workspace: Workspace }>('/workspaces', { name, slug });
    return res.data.workspace;
  },

  async getWorkspaceDetails(id: string): Promise<WorkspaceDetails> {
    const res = await api.get<{ workspace: WorkspaceDetails }>(`/workspaces/${id}`);
    return res.data.workspace;
  },

  async updateWorkspace(
    id: string,
    payload: { name?: string; slug?: string; settings?: WorkspaceSettings },
  ): Promise<Workspace> {
    const res = await api.patch<{ workspace: Workspace }>(`/workspaces/${id}`, payload);
    return res.data.workspace;
  },

  async deleteWorkspace(id: string): Promise<void> {
    await api.delete(`/workspaces/${id}`);
  },

  async listMembers(id: string): Promise<WorkspaceMember[]> {
    const res = await api.get<{ members: WorkspaceMember[] }>(`/workspaces/${id}/members`);
    return res.data.members;
  },

  async inviteMember(id: string, email: string, role?: WorkspaceRole): Promise<WorkspaceMember> {
    const res = await api.post<{ member: WorkspaceMember }>(`/workspaces/${id}/members`, {
      email,
      role,
    });
    return res.data.member;
  },

  async updateMemberRole(id: string, memberUserId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    const res = await api.patch<{ member: WorkspaceMember }>(
      `/workspaces/${id}/members/${memberUserId}`,
      { role },
    );
    return res.data.member;
  },

  async removeMember(id: string, memberUserId: string): Promise<void> {
    await api.delete(`/workspaces/${id}/members/${memberUserId}`);
  },
};

export default workspaceService;
