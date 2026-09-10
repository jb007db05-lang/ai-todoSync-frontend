import { useWorkspace } from '../context/WorkspaceContext';

/** Access just the active workspace and switch capability */
export function useActiveWorkspace() {
  const { activeWorkspace, activeWorkspaceId, switchWorkspace } = useWorkspace();
  return { activeWorkspace, activeWorkspaceId, switchWorkspace };
}

export default useActiveWorkspace;
