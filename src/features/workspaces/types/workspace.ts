export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'GUEST';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  role: WorkspaceRole;
  memberCount: number;
  projectCount: number;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
}

export interface WorkspaceSettings {
  defaultProjectRole?: string;
  allowGuestInvites?: boolean;
}

export interface WorkspaceDetails extends Workspace {
  settings?: WorkspaceSettings;
  currentUserRole: WorkspaceRole;
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

export const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 5,
  ADMIN: 4,
  MANAGER: 3,
  MEMBER: 2,
  GUEST: 1,
};

export function canManageRole(actorRole: WorkspaceRole, targetRole: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export function isAtLeastAdmin(role: WorkspaceRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY['ADMIN'];
}

export function isOwner(role: WorkspaceRole): boolean {
  return role === 'OWNER';
}
