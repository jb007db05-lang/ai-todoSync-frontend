import api from "./api";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "GUEST";
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface WorkspaceDetails extends Workspace {
  settings?: {
    defaultProjectRole?: string;
    allowGuestInvites?: boolean;
  };
  members: WorkspaceMember[];
  projects: Array<{
    id: string;
    name: string;
    description?: string;
    icon: string;
    color: string;
    status: string;
    priority: string;
  }>;
}

export const workspaceService = {
  async listWorkspaces(): Promise<Workspace[]> {
    const res = await api.get<{ workspaces: Workspace[] }>("/workspaces");
    return res.data.workspaces;
  },

  async createWorkspace(name: string, slug?: string): Promise<Workspace> {
    const res = await api.post<{ workspace: Workspace }>("/workspaces", {
      name,
      slug,
    });
    return res.data.workspace;
  },

  async getWorkspaceDetails(id: string): Promise<WorkspaceDetails> {
    const res = await api.get<{ workspace: WorkspaceDetails }>(`/workspaces/${id}`);
    return res.data.workspace;
  },

  async updateWorkspace(id: string, payload: { name?: string; settings?: Record<string, unknown> }): Promise<Workspace> {
    const res = await api.patch<{ workspace: Workspace }>(`/workspaces/${id}`, payload);
    return res.data.workspace;
  },

  async inviteMember(id: string, email: string, role?: string): Promise<WorkspaceMember> {
    const res = await api.post<{ member: WorkspaceMember }>(`/workspaces/${id}/members`, {
      email,
      role,
    });
    return res.data.member;
  },

  async removeMember(id: string, memberUserId: string): Promise<void> {
    await api.delete(`/workspaces/${id}/members/${memberUserId}`);
  },
};

export default workspaceService;
