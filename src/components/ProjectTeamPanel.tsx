import { LogOut, Search, Shield, Trash2, UserPlus, Users } from 'lucide-react';

import type { ProjectMember, UserSearchResult } from '@/types/project';

interface ProjectTeamPanelProps {
  canManageTeam: boolean;
  currentUserId: string | null;
  isMutating: boolean;
  members: ProjectMember[];
  onAddMember: (userId: string) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onLeaveProject: () => Promise<void>;
  onSearchChange: (value: string) => void;
  searchResults: UserSearchResult[];
  searchTerm: string;
}

function ProjectTeamPanel({
  canManageTeam,
  currentUserId,
  isMutating,
  members,
  onAddMember,
  onRemoveMember,
  onLeaveProject,
  onSearchChange,
  searchResults,
  searchTerm
}: ProjectTeamPanelProps): JSX.Element {
  return (
    <section className="relative overflow-hidden bg-white    border border-olive-200/80  rounded-xl grid gap-5 p-5 md:p-6 shadow-sm">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-olive-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-10 w-36 h-36 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] font-bold text-olive-600 ">
              <Users size={13} className="text-olive-500" />
              Team Members
            </span>
            <h3 className="m-0 mt-2 text-[1.2rem] font-bold text-olive-950 ">
              Project members
            </h3>
          </div>

          <div className="px-3.5 flex items-center justify-between gap-2 py-2 rounded-lg border border-olive-200/80  bg-white/80  shadow-sm">
            <div className="text-[0.68rem] uppercase tracking-[0.14em] font-bold text-olive-500 ">Members</div>
            <div className="text-[14px] font-bold text-olive-950 ">{members.length}</div>
          </div>
        </div>

        <div className="grid gap-3">
          {members.length === 0 ? (
            <div className="px-4 py-5 rounded-lg border border-dashed border-olive-200  text-[0.84rem] text-olive-500  bg-white/70 ">
              No project members are loaded yet.
            </div>
          ) : (
            members.map((member) => (
              (() => {
                const isAdmin = member.role === 'ADMIN';

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-olive-200/80  bg-white/88  shadow-sm"
                  >
                    <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-olive-50 text-olive-700   text-sm font-bold shrink-0">
                      {(member.user.name || member.user.email).slice(0, 1).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[0.92rem] font-semibold text-olive-950  truncate">
                        {member.user.name || member.user.email}
                      </div>
                      <div className="text-[0.78rem] text-olive-500  truncate">
                        {member.user.email}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[0.68rem] font-bold uppercase tracking-[0.08em] ${isAdmin
                          ? 'bg-olive-50 text-olive-700'
                          : 'bg-olive-100 text-olive-600'
                        }`}
                    >
                      {isAdmin ? <Shield size={12} /> : null}
                      {member.role}
                    </span>

                    {member.userId === currentUserId && (
                      <button
                        className="p-2.5 rounded-xl text-olive-400 hover:text-red-500 hover:bg-red-50  transition-colors disabled:opacity-50 disabled:hover:text-olive-400 disabled:hover:bg-transparent"
                        disabled={isMutating || isAdmin}
                        onClick={() => void onLeaveProject()}
                        title={isAdmin
                          ? 'Project admins cannot leave. They must delete the project.'
                          : 'Leave project'}
                        type="button"
                      >
                        <LogOut size={15} />
                      </button>
                    )}

                    {canManageTeam && member.userId !== currentUserId ? (
                      <button
                        className="p-2.5 rounded-xl text-olive-400 hover:text-red-500 hover:bg-red-50  transition-colors disabled:opacity-50 disabled:hover:text-olive-400 disabled:hover:bg-transparent"
                        disabled={isMutating || isAdmin}
                        onClick={() => void onRemoveMember(member.userId)}
                        title={isAdmin
                          ? 'Project admins cannot be removed'
                          : 'Remove member'}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : null}
                  </div>
                );
              })()
            ))
          )}
        </div>

        {canManageTeam ? (
          <div className="grid gap-3 rounded-xl border border-olive-200/80  bg-white/76  p-4 md:p-5">
            <div>
              <h4 className="m-0 text-[0.92rem] font-bold text-olive-950 ">Add registered user</h4>
              <p className="m-0 mt-1 text-[0.78rem] text-olive-500 ">
                Search by email and add them as a project member.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-olive-400 " size={14} />
              <input
                className="w-full h-12 rounded-lg border border-olive-200  bg-white  px-10 pr-4 text-sm text-olive-950  focus:outline-none focus:ring-2 focus:ring-olive-500/20"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search registered users by email"
                type="text"
                value={searchTerm}
              />
            </div>

            {searchTerm.trim().length >= 2 ? (
              <div className="grid gap-2 max-h-[18rem] overflow-y-auto pr-1">
                {searchResults.length === 0 ? (
                  <div className="px-3 py-3 rounded-xl border border-dashed border-olive-200  text-[0.8rem] text-olive-500 ">
                    No registered users match this email.
                  </div>
                ) : (
                  searchResults.map((user) => {
                    const existingMember = members.some((member) => member.userId === user.id);

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-olive-200  bg-white "
                      >
                        <div className="min-w-0">
                          <div className="text-[0.84rem] font-semibold text-olive-950  truncate">
                            {user.name || user.email}
                          </div>
                          <div className="text-[0.74rem] text-olive-500  truncate">
                            {user.email}
                          </div>
                        </div>

                        <button
                          className="inline-flex items-center gap-2 px-3 py-2.5 rounded-xl bg-olive-900  text-white text-[0.78rem] font-semibold disabled:opacity-50 shadow-sm"
                          disabled={existingMember || isMutating}
                          onClick={() => void onAddMember(user.id)}
                          type="button"
                        >
                          <UserPlus size={14} />
                          {existingMember ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="px-4 py-3 rounded-lg border border-olive-200/80  bg-white/76  text-[0.8rem] text-olive-500 ">
            You can view the team here. Admins manage membership changes.
          </div>
        )}
      </div>
    </section>
  );
}

export default ProjectTeamPanel;