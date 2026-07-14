import { useState, useEffect, useCallback } from 'react';
import { LogOut, Shield, Trash2, UserPlus, Users, Loader2, Mail, Clock, RotateCcw } from 'lucide-react';
import type { ProjectMember } from '@/types/project';
import { getProjectInvitations, revokeInvitation, type ProjectInvitation } from '@/services/invitations';

interface ProjectTeamPanelProps {
  canManageTeam: boolean;
  currentUserId: string | null;
  isMutating: boolean;
  members: ProjectMember[];
  projectId: string;
  onInviteMember: (email: string, role: 'ADMIN' | 'MEMBER') => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onLeaveProject: () => Promise<void>;
}

const formatRelative = (date?: string): string => {
  if (!date) return '';
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

function ProjectTeamPanel({
  canManageTeam,
  currentUserId,
  isMutating,
  members,
  projectId,
  onInviteMember,
  onRemoveMember,
  onLeaveProject
}: ProjectTeamPanelProps): JSX.Element {
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [pendingInvitations, setPendingInvitations] = useState<ProjectInvitation[]>([]);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadPendingInvitations = useCallback(async () => {
    if (!canManageTeam || !projectId) return;
    try {
      const invitations = await getProjectInvitations(projectId);
      setPendingInvitations(invitations);
    } catch {
      // silently fail
    }
  }, [canManageTeam, projectId]);

  useEffect(() => {
    void loadPendingInvitations();
  }, [loadPendingInvitations]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    try {
      await onInviteMember(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      // Reload pending invitations list
      await loadPendingInvitations();
    } catch {
      // Handled by parent error state/toast
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRevoke = async (invitation: ProjectInvitation) => {
    setRevokingId(invitation.id);
    try {
      await revokeInvitation(invitation.id);
      setPendingInvitations((prev) => prev.filter((inv) => inv.id !== invitation.id));
    } catch {
      // silently fail
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <section className="relative overflow-hidden bg-white border border-olive-200/80 rounded-xl grid gap-5 p-5 md:p-6 shadow-sm">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-olive-500/10 blur-3xl pointer-events-none" />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-olive-100 pb-3">
          <h3 className="m-0 text-base font-bold text-olive-950 flex items-center gap-2">
            <Users className="text-olive-700" size={18} />
            Project Members
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-olive-50 text-olive-700 border border-olive-100">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Active Members */}
        <div className="grid gap-2 max-h-[16rem] overflow-y-auto pr-1">
          {members.map((member) => (
            (() => {
              const isAdmin = member.role === 'ADMIN';
              const isCurrentUser = member.userId === currentUserId;

              return (
                <div
                  key={member.userId}
                  className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl border border-olive-200/80 bg-white/50 hover:bg-olive-50/30 transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-olive-100 to-olive-200/60 flex items-center justify-center font-bold text-olive-800 text-sm shadow-inner">
                        {member.user?.name ? member.user.name[0].toUpperCase() : (member.user?.email ? member.user.email[0].toUpperCase() : '?')}
                      </div>
                      {isAdmin && (
                        <div className="absolute -bottom-1 -right-1 bg-olive-800 text-white rounded-md p-0.5 border border-white shadow-sm">
                          <Shield size={10} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-[0.84rem] font-bold text-olive-950 truncate flex items-center gap-1.5">
                        {member.user?.name || member.user?.email || 'Unknown Member'}
                        {isCurrentUser && (
                          <span className="text-[0.68rem] font-medium px-1.5 py-0.5 bg-olive-100 text-olive-700 rounded border border-olive-200/40">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[0.74rem] text-olive-500 font-medium truncate">
                        {member.user?.email ?? member.role}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isCurrentUser ? (
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50/80 border border-transparent hover:border-red-100 active:scale-95 transition-all duration-200 disabled:opacity-50"
                        disabled={isMutating}
                        onClick={() => void onLeaveProject()}
                        type="button"
                      >
                        <LogOut size={13} />
                        Leave
                      </button>
                    ) : null}

                    {canManageTeam && member.userId !== currentUserId ? (
                      <button
                        className="p-2.5 rounded-xl text-olive-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:hover:text-olive-400 disabled:hover:bg-transparent"
                        disabled={isMutating || isAdmin}
                        onClick={() => void onRemoveMember(member.userId)}
                        title={isAdmin ? 'Project admins cannot be removed' : 'Remove member'}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })()
          ))}
        </div>

        {/* Pending Invitations */}
        {canManageTeam && pendingInvitations.length > 0 ? (
          <div className="grid gap-2">
            <div className="flex items-center gap-2 text-[0.78rem] font-bold text-olive-600 uppercase tracking-widest">
              <Clock size={12} />
              Pending Invitations ({pendingInvitations.length})
            </div>
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-dashed border-olive-300/60 bg-olive-50/30"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-olive-100 flex items-center justify-center shrink-0">
                    <Mail size={13} className="text-olive-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.82rem] font-semibold text-olive-800 truncate">
                      {inv.email}
                    </div>
                    <div className="flex items-center gap-2 text-[0.70rem] text-olive-400">
                      <span className="font-bold uppercase tracking-wide">{inv.role}</span>
                      {inv.createdAt ? (
                        <>
                          <span>·</span>
                          <span>Invited {formatRelative(inv.createdAt)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                <button
                  className="p-2 rounded-xl text-olive-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                  disabled={revokingId === inv.id}
                  onClick={() => void handleRevoke(inv)}
                  title="Revoke invitation"
                  type="button"
                >
                  {revokingId === inv.id ? (
                    <RotateCcw size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Add Member Form */}
        {canManageTeam ? (
          <form onSubmit={handleSendInvite} className="grid gap-3.5 rounded-xl border border-olive-200/80 bg-olive-50/20 p-4 md:p-5">
            <div>
              <h4 className="m-0 text-[0.92rem] font-bold text-olive-950 flex items-center gap-2">
                <UserPlus size={16} className="text-olive-700" />
                Add team member
              </h4>
              <p className="m-0 mt-1 text-[0.78rem] text-olive-500">
                Enter an email address. Registered users receive an in-portal invitation; unregistered users receive an email to register then join.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className="flex-1 h-12 rounded-lg border border-olive-200 bg-white px-4 text-sm text-olive-950 focus:outline-none focus:ring-2 focus:ring-olive-500/20"
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter user's email address"
                required
                type="email"
                value={inviteEmail}
              />
              
              <select
                className="h-12 rounded-lg border border-olive-200 bg-white px-3 text-sm text-olive-950 focus:outline-none focus:ring-2 focus:ring-olive-500/20 font-semibold"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'ADMIN' | 'MEMBER')}
              >
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>

              <button
                className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-lg bg-olive-900 text-white text-[0.84rem] font-semibold disabled:opacity-50 shadow-sm whitespace-nowrap active:scale-[0.98] transition-all"
                disabled={inviteLoading || isMutating}
                type="submit"
              >
                {inviteLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <UserPlus size={16} />
                )}
                Send Invite
              </button>
            </div>
          </form>
        ) : (
          <div className="px-4 py-3 rounded-lg border border-olive-200/80 bg-white/76 text-[0.8rem] text-olive-500">
            You can view the team here. Admins manage membership changes.
          </div>
        )}
      </div>
    </section>
  );
}

export default ProjectTeamPanel;