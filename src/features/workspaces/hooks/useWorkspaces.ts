import { useWorkspace } from '../context/WorkspaceContext';

/** Access the full workspaces list and management helpers */
export function useWorkspaces() {
  const { workspaces, isLoading, refreshWorkspaces, createWorkspace } = useWorkspace();
  return { workspaces, isLoading, refreshWorkspaces, createWorkspace };
}

export default useWorkspaces;
