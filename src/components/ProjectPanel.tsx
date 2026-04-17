import type { Project } from '@/types/project';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, FolderKanban, Layers3, Pencil, Plus, Search, Trash2, Calendar } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface ProjectPanelProps {
  actionProjectId: string | null;
  loading: boolean;
  onOpenCreateProject: () => void;
  onOpenEpicManager: (project: Project) => void;
  onOpenProject: (projectId: string | null) => void;
  onOpenUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  onDeleteProjects: (projectIds: string[]) => Promise<void>;
  projects: Project[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  searchTerm: string;
}

function ProjectPanel({
  actionProjectId,
  loading,
  onOpenCreateProject,
  onOpenEpicManager,
  onOpenProject,
  onOpenUpdateProject,
  onDeleteProject,
  onDeleteProjects,
  projects,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  searchTerm,
}: ProjectPanelProps): JSX.Element {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(projects.filter((project) => project.currentUserRole === 'ADMIN').map((project) => project.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (projectId: string, e: React.MouseEvent | React.ChangeEvent) => {
    if (e.type === 'change' || (e as React.MouseEvent).target instanceof HTMLInputElement) {
      // managed below
    }
    const project = projects.find((entry) => entry.id === projectId);
    if (project?.currentUserRole !== 'ADMIN') {
      return;
    }
    const next = new Set(selectedIds);
    if (next.has(projectId)) {
      next.delete(projectId);
    } else {
      next.add(projectId);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    await onDeleteProjects(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const adminProjectsCount = projects.filter((project) => project.currentUserRole === 'ADMIN').length;
  const isAllSelected = adminProjectsCount > 0 && selectedIds.size === adminProjectsCount;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < adminProjectsCount;

  const thCls = 'text-left px-4 py-3 text-[0.8rem] font-bold uppercase tracking-[0.05em] text-zinc-500 dark:text-slate-400 bg-zinc-50 dark:bg-slate-800 border-b border-zinc-200 dark:border-slate-700 sticky top-0 z-10';
  const rowActionCls = 'flex items-center justify-center w-7 h-7 rounded text-zinc-400 dark:text-slate-500 transition-all duration-150 hover:-translate-y-px';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium'
    }).format(new Date(dateString));
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      timeStyle: 'short'
    }).format(new Date(dateString));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800">
        <div className="grid gap-0.5">
          <h4 className="m-0 font-bold text-olive-950 dark:text-slate-100 text-[0.95rem]">Project Directory</h4>
          <span className="text-zinc-400 dark:text-slate-500 text-[0.75rem]">Full Workspace Management</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-zinc-200 dark:bg-slate-700 opacity-60 mx-2" />

        {/* Search */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-2.5 text-zinc-400 dark:text-slate-500" size={14} />
          <input
            className="w-full h-9 pl-[38px] pr-3 text-[0.85rem] bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-md shadow-inner transition-all duration-200 focus:outline-none focus:border-olive-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-olive-500/12 text-olive-950 dark:text-slate-100"
            onChange={handleSearchChange}
            placeholder="Filter projects..."
            type="text"
            value={searchTerm}
          />
        </div>

        {selectedIds.size > 0 && (
          <button
            className="inline-flex items-center gap-2 h-9 px-4 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            onClick={handleDeleteSelected}
            type="button"
          >
            <Trash2 size={16} />
            <span>Delete Selected ({selectedIds.size})</span>
          </button>
        )}

        <button
          className="inline-flex items-center gap-2 h-9 px-4 bg-olive-900 dark:bg-olive-600 text-white rounded text-sm font-medium hover:bg-olive-800 dark:hover:bg-olive-500 transition-colors"
          onClick={onOpenCreateProject}
          type="button"
        >
          <Plus size={16} />
          <span>New project</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="flex-1 overflow-y-auto px-1 py-1">
        <table className="w-full border-separate border-spacing-y-2 text-[0.95rem]">
          <thead>
            <tr>
              <th className={`${thCls} !pl-5`} style={{ width: 40 }}>
                <input
                  checked={isAllSelected}
                  className="w-5 h-5 cursor-pointer accent-olive-600"
                  onChange={handleSelectAll}
                  ref={el => el && (el.indeterminate = isSomeSelected)}
                  type="checkbox"
                />
              </th>
              <th className={thCls} style={{ width: '35%' }}>Project</th>
              <th className={thCls} style={{ width: '20%' }}>Creator</th>
              <th className={thCls} style={{ width: '15%' }}>Date</th>
              <th className={thCls} style={{ width: '10%' }}>Time</th>
              <th className={`${thCls} text-right !pr-6`} style={{ width: '20%' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="text-zinc-400 dark:text-slate-500 text-center py-8" colSpan={4}>Refreshing projects...</td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td className="text-zinc-400 dark:text-slate-500 text-center py-8" colSpan={4}>
                  {searchTerm ? 'No projects match your search.' : 'No projects found.'}
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  className={[
                    'cursor-pointer transition-all duration-200 relative bg-white dark:bg-slate-800/80 shadow-sm hover:shadow-md border border-zinc-100 dark:border-slate-700/50 group',
                    selectedIds.has(project.id)
                      ? 'ring-2 ring-olive-500/30'
                      : ''
                  ].join(' ')}
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                >
                  <td className="px-5 py-3 align-middle group-first/tr:rounded-tl-xl group-first/tr:rounded-bl-xl border-y border-l border-transparent first:rounded-l-xl" onClick={(e) => e.stopPropagation()}>
                    <input
                      checked={selectedIds.has(project.id)}
                      className="w-5 h-5 cursor-pointer accent-olive-600"
                      disabled={project.currentUserRole !== 'ADMIN'}
                      onChange={(e) => handleSelectRow(project.id, e)}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-5 py-3 align-middle border-y border-transparent">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="text-olive-600 dark:text-olive-500 shrink-0" size={18} />
                      <div className="grid gap-0.5">
                        <strong className="text-olive-900 dark:text-slate-100 font-bold text-[1rem]">{project.name}</strong>
                        {project.description && (
                          <span className="text-zinc-400 dark:text-slate-500 text-[0.85rem] truncate max-w-[300px]">{project.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle border-y border-transparent text-[0.95rem]">
                    <div className="flex items-center gap-3">
                      {project.creator ? (
                        <UserAvatar 
                          size="md" 
                          name={project.creator.name} 
                          email={project.creator.email}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 flex items-center justify-center">
                          <Plus size={14} className="text-zinc-400" />
                        </div>
                      )}
                      <span className="text-zinc-700 dark:text-slate-300 font-semibold">
                        {project.creator?.name || project.creator?.email || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle border-y border-transparent text-[0.95rem]">
                    <div className="flex items-center gap-2 text-zinc-600 dark:text-slate-300">
                      <Calendar size={14} className="opacity-60" />
                      <span>{formatDate(project.createdAt)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 align-middle border-y border-transparent text-[0.95rem] font-medium text-zinc-500 dark:text-slate-400">
                    {formatTime(project.createdAt)}
                  </td>
                  <td className="px-5 py-3 align-middle border-y border-r border-transparent last:rounded-r-xl">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className={`${rowActionCls} !w-10 !h-10 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-olive-600 dark:hover:text-blue-400 disabled:opacity-40`}
                        disabled={project.currentUserRole !== 'ADMIN'}
                        onClick={(e) => { e.stopPropagation(); onOpenEpicManager(project); }}
                        title="Epics"
                        type="button"
                      >
                        <Layers3 size={20} />
                      </button>
                      <button
                        className={`${rowActionCls} !w-10 !h-10 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-olive-900 dark:hover:text-slate-100 disabled:opacity-40`}
                        disabled={project.currentUserRole !== 'ADMIN'}
                        onClick={(e) => { e.stopPropagation(); onOpenUpdateProject(project); }}
                        title="Edit project"
                        type="button"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        className={`${rowActionCls} !w-10 !h-10 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50`}
                        disabled={actionProjectId === project.id || project.currentUserRole !== 'ADMIN'}
                        onClick={(e) => { e.stopPropagation(); void onDeleteProject(project.id); }}
                        title="Delete project"
                        type="button"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800">
        <div className="text-[0.75rem] text-zinc-400 dark:text-slate-500">
          Page <strong className="text-zinc-700 dark:text-slate-300">{currentPage}</strong> of{' '}
          <strong className="text-zinc-700 dark:text-slate-300">{totalPages}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="w-7 h-7 p-0 flex items-center justify-center bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-500 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="w-7 h-7 p-0 flex items-center justify-center bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-500 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProjectPanel;
