import type { Project } from '@/types/project';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, FolderKanban, Layers3, Pencil, Plus, Search, Trash2 } from 'lucide-react';

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
  tasksByProject: Map<string | null, number>;
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
  tasksByProject,
  currentPage,
  totalPages,
  onPageChange,
  onSearch,
  searchTerm,
}: ProjectPanelProps): JSX.Element {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  console.log("tasksByProject", tasksByProject);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(projects.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (projectId: string, e: React.MouseEvent | React.ChangeEvent) => {
    if (e.type === 'change' || (e as React.MouseEvent).target instanceof HTMLInputElement) {
      // managed below
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

  const isAllSelected = projects.length > 0 && selectedIds.size === projects.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < projects.length;

  const thCls = 'text-left px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.05em] text-zinc-500 dark:text-slate-400 bg-zinc-50 dark:bg-slate-800 border-b border-zinc-200 dark:border-slate-700 sticky top-0 z-10';
  const rowActionCls = 'flex items-center justify-center w-7 h-7 rounded text-zinc-400 dark:text-slate-500 transition-all duration-150 hover:-translate-y-px';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800">
        <div className="grid gap-0.5">
          <h4 className="m-0 font-bold text-zinc-900 dark:text-slate-100 text-[0.95rem]">Project Directory</h4>
          <span className="text-zinc-400 dark:text-slate-500 text-[0.75rem]">Full Workspace Management</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-zinc-200 dark:bg-slate-700 opacity-60 mx-2" />

        {/* Search */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-2.5 text-zinc-400 dark:text-slate-500" size={14} />
          <input
            className="w-full h-9 pl-[38px] pr-3 text-[0.85rem] bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-md shadow-inner transition-all duration-200 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/12 text-zinc-900 dark:text-slate-100"
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
          className="inline-flex items-center gap-2 h-9 px-4 bg-zinc-900 dark:bg-blue-600 text-white rounded text-sm font-medium hover:bg-zinc-700 dark:hover:bg-blue-500 transition-colors"
          onClick={onOpenCreateProject}
          type="button"
        >
          <Plus size={16} />
          <span>New project</span>
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto py-2">
        <table className="w-full border-collapse text-[0.85rem]">
          <thead>
            <tr>
              <th className={thCls} style={{ width: 40 }}>
                <input
                  checked={isAllSelected}
                  className="w-4 h-4 cursor-pointer accent-blue-600"
                  onChange={handleSelectAll}
                  ref={el => el && (el.indeterminate = isSomeSelected)}
                  type="checkbox"
                />
              </th>
              <th className={thCls} style={{ width: '70%' }}>Project</th>
              {/* <th className={thCls} style={{ width: '20%' }}>Tasks</th> */}
              <th className={`${thCls} text-right`} style={{ width: '25%' }}>Actions</th>
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
                    'border-b border-transparent cursor-pointer transition-colors relative',
                    selectedIds.has(project.id)
                      ? 'bg-blue-600/2 dark:bg-blue-500/5'
                      : 'hover:bg-indigo-600/3 dark:hover:bg-indigo-400/5'
                  ].join(' ')}
                  key={project.id}
                  onClick={() => onOpenProject(project.id)}
                >
                  <td className="px-5 py-3.5 align-middle" onClick={(e) => e.stopPropagation()}>
                    <input
                      checked={selectedIds.has(project.id)}
                      className="w-4 h-4 cursor-pointer accent-blue-600"
                      onChange={(e) => handleSelectRow(project.id, e)}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-5 py-3.5 align-middle">
                    <div className="flex items-center gap-3">
                      <FolderKanban className="text-blue-600 dark:text-blue-400 shrink-0" size={14} />
                      <div className="grid gap-0.5">
                        <strong className="text-zinc-800 dark:text-slate-100 font-semibold text-[0.9rem]">{project.name}</strong>
                        {project.description && (
                          <span className="text-zinc-400 dark:text-slate-500 text-[0.75rem] truncate max-w-[300px]">{project.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* <td className="px-5 py-3.5 align-middle">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[0.7rem] font-bold">
                      {tasksByProject.get(project.id) ?? 0}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 align-middle">
                    <span className="inline-block border rounded text-[0.72rem] font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                      {tasksByProject.get(project.id) ?? 0}
                    </span>
                  </td> */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        className={`${rowActionCls} hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-blue-600 dark:hover:text-blue-400`}
                        onClick={(e) => { e.stopPropagation(); onOpenEpicManager(project); }}
                        title="Epics"
                        type="button"
                      >
                        <Layers3 size={14} />
                      </button>
                      <button
                        className={`${rowActionCls} hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-zinc-800 dark:hover:text-slate-100`}
                        onClick={(e) => { e.stopPropagation(); onOpenUpdateProject(project); }}
                        title="Edit project"
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className={`${rowActionCls} hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50`}
                        disabled={actionProjectId === project.id}
                        onClick={(e) => { e.stopPropagation(); void onDeleteProject(project.id); }}
                        title="Delete project"
                        type="button"
                      >
                        <Trash2 size={14} />
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
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="w-7 h-7 p-0 flex items-center justify-center bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-500 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
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
