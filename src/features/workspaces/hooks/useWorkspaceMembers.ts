import { useCallback, useEffect, useState } from 'react';
import { workspaceService } from '../services/workspaceService';
import type { WorkspaceMember, WorkspaceRole } from '../types/workspace';

export function useWorkspaceMembers(workspaceId: string | null | undefined) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await workspaceService.listMembers(workspaceId);
      setMembers(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load members');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  const inviteMember = useCallback(
    async (email: string, role?: WorkspaceRole) => {
      if (!workspaceId) return;
      const member = await workspaceService.inviteMember(workspaceId, email, role);
      setMembers((prev) => [...prev, member]);
      return member;
    },
    [workspaceId],
  );

  const updateMemberRole = useCallback(
    async (memberUserId: string, role: WorkspaceRole) => {
      if (!workspaceId) return;
      await workspaceService.updateMemberRole(workspaceId, memberUserId, role);
      setMembers((prev) =>
        prev.map((m) => (m.userId === memberUserId ? { ...m, role } : m)),
      );
    },
    [workspaceId],
  );

  const removeMember = useCallback(
    async (memberUserId: string) => {
      if (!workspaceId) return;
      await workspaceService.removeMember(workspaceId, memberUserId);
      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId));
    },
    [workspaceId],
  );

  return {
    members,
    isLoading,
    error,
    refreshMembers: fetchMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
  };
}

export default useWorkspaceMembers;
