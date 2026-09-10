// Context & Provider
export { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';

// Hooks
export { useWorkspaces } from './hooks/useWorkspaces';
export { useActiveWorkspace } from './hooks/useActiveWorkspace';
export { useWorkspaceMembers } from './hooks/useWorkspaceMembers';

// Components
export { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
export { CreateWorkspaceDialog } from './components/CreateWorkspaceDialog';
export { WorkspaceSettingsPanel } from './components/WorkspaceSettingsPanel';
export { WorkspaceMembers } from './components/WorkspaceMembers';
export { WorkspaceMemberRow } from './components/WorkspaceMemberRow';
export { InviteMemberDialog } from './components/InviteMemberDialog';
export { WorkspaceGeneralSettings } from './components/WorkspaceGeneralSettings';
export { WorkspaceDangerZone } from './components/WorkspaceDangerZone';

// Services
export { workspaceService } from './services/workspaceService';

// Types
export type {
  Workspace,
  WorkspaceMember,
  WorkspaceDetails,
  WorkspaceRole,
  WorkspaceSettings,
} from './types/workspace';
export { ROLE_HIERARCHY, canManageRole, isAtLeastAdmin, isOwner } from './types/workspace';
