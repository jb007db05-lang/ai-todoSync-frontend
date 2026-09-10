import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { workspaceService } from '../services/workspaceService';
import type { Workspace } from '../types/workspace';

const ACTIVE_WS_KEY = 'active_workspace_id';

interface WorkspaceContextValue {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  activeWorkspaceId: string;
  isLoading: boolean;
  switchWorkspace: (workspace: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, slug?: string) => Promise<Workspace>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function getPersistedWorkspaceId(): string {
  return localStorage.getItem(ACTIVE_WS_KEY) ?? '';
}

function persistWorkspaceId(id: string): void {
  localStorage.setItem(ACTIVE_WS_KEY, id);
}

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps): JSX.Element {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(getPersistedWorkspaceId);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await workspaceService.listWorkspaces();
      setWorkspaces(list);

      // Restore persisted selection or default to first
      const persisted = getPersistedWorkspaceId();
      const isValid = persisted && list.some((w) => w.id === persisted);
      if (isValid) {
        setActiveWorkspaceId(persisted);
      } else if (list.length > 0) {
        const firstId = list[0].id;
        setActiveWorkspaceId(firstId);
        persistWorkspaceId(firstId);
      }
    } catch {
      // Non-fatal — workspace list will be empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load workspaces once on mount (user must be authenticated at this point)
  useEffect(() => {
    void loadWorkspaces();
  }, [loadWorkspaces]);

  const switchWorkspace = useCallback((workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
    persistWorkspaceId(workspace.id);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    await loadWorkspaces();
  }, [loadWorkspaces]);

  const createWorkspace = useCallback(
    async (name: string, slug?: string): Promise<Workspace> => {
      const created = await workspaceService.createWorkspace(name, slug);
      setWorkspaces((prev) => [...prev, created]);
      switchWorkspace(created);
      return created;
    },
    [switchWorkspace],
  );

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? null,
    [workspaces, activeWorkspaceId],
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      activeWorkspace,
      activeWorkspaceId: activeWorkspace?.id ?? '',
      isLoading,
      switchWorkspace,
      refreshWorkspaces,
      createWorkspace,
    }),
    [workspaces, activeWorkspace, isLoading, switchWorkspace, refreshWorkspaces, createWorkspace],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}

export default WorkspaceProvider;
