/**
 * @deprecated Import from '@/features/workspaces' instead.
 * This file is kept for backward compatibility only.
 */
export type {
  Workspace,
  WorkspaceMember,
  WorkspaceDetails,
  WorkspaceRole,
  WorkspaceSettings,
} from '@/features/workspaces/types/workspace';

export { workspaceService } from '@/features/workspaces/services/workspaceService';
export { workspaceService as default } from '@/features/workspaces/services/workspaceService';
