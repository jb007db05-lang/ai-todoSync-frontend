import React, { useState, useMemo } from 'react';
import type { Project } from '@/types/project';
import {
  FolderKanban,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
  Calendar
} from 'lucide-react';
import UserAvatar from './UserAvatar';
import noDataImage from '@/assets/no_data.png';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import DataTable from './DataTable';

const columnHelper = createColumnHelper<Project>();

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
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo(() => [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            className="w-5 h-5 cursor-pointer accent-olive-600"
            checked={table.getIsAllPageRowsSelected()}
            ref={(el) => {
              if (el) {
                el.indeterminate = table.getIsSomePageRowsSelected();
              }
            }}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-5 h-5 cursor-pointer accent-olive-600"
            checked={row.getIsSelected()}
            disabled={row.original.currentUserRole !== 'ADMIN'}
            onChange={row.getToggleSelectedHandler()}
          />
        </div>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('name', {
      header: 'Project',
      cell: info => (
        <div className="flex items-center gap-3">
          <FolderKanban className="text-olive-600 dark:text-olive-500 shrink-0" size={18} />
          <div className="grid gap-0.5">
            <strong className="text-olive-900 dark:text-slate-100 font-bold text-[1rem]">{info.getValue()}</strong>
            {info.row.original.description && (
              <span className="text-zinc-400 dark:text-slate-500 text-[0.85rem] truncate max-w-[300px]">
                {info.row.original.description}
              </span>
            )}
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('creator', {
      header: 'Creator',
      cell: info => {
        const creator = info.getValue();
        return (
          <div className="flex items-center gap-3">
            {creator ? (
              <UserAvatar size="md" name={creator.name} email={creator.email} />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 flex items-center justify-center">
                <Plus size={14} className="text-zinc-400" />
              </div>
            )}
            <span className="text-zinc-700 dark:text-slate-300 font-semibold truncate max-w-[120px]">
              {creator?.name || creator?.email || 'Unknown'}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor('createdAt', {
      id: 'date',
      header: 'Date',
      cell: info => (
        <div className="flex items-center gap-2 text-zinc-600 dark:text-slate-300">
          <Calendar size={14} className="opacity-60" />
          <span>{formatDate(info.getValue())}</span>
        </div>
      ),
    }),
    columnHelper.accessor('createdAt', {
      id: 'time',
      header: 'Time',
      cell: info => formatTime(info.getValue()),
      enableSorting: false,
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const project = row.original;
        const rowActionCls = 'flex items-center justify-center w-7 h-7 rounded text-zinc-400 dark:text-slate-500 transition-all duration-150 hover:-translate-y-px';
        return (
          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              className={`${rowActionCls} !w-10 !h-10 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-olive-600 dark:hover:text-blue-400 disabled:opacity-40`}
              disabled={project.currentUserRole !== 'ADMIN'}
              onClick={() => onOpenEpicManager(project)}
              title="Epics"
              type="button"
            >
              <Layers3 size={20} />
            </button>
            <button
              className={`${rowActionCls} !w-10 !h-10 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-olive-900 dark:hover:text-slate-100 disabled:opacity-40`}
              disabled={project.currentUserRole !== 'ADMIN'}
              onClick={() => onOpenUpdateProject(project)}
              title="Edit project"
              type="button"
            >
              <Pencil size={20} />
            </button>
            <button
              className={`${rowActionCls} !w-10 !h-10 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 disabled:opacity-50`}
              disabled={actionProjectId === project.id || project.currentUserRole !== 'ADMIN'}
              onClick={() => void onDeleteProject(project.id)}
              title="Delete project"
              type="button"
            >
              <Trash2 size={20} />
            </button>
          </div>
        );
      },
      enableSorting: false,
    }),
  ], [onOpenEpicManager, onOpenUpdateProject, onDeleteProject, actionProjectId]);

  const table = useReactTable({
    data: projects,
    columns,
    state: {
      rowSelection,
      sorting,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: row => row.id,
  });

  const selectedProjects = useMemo(() => {
    return table.getSelectedRowModel().flatRows.map(row => row.original);
  }, [rowSelection, projects]);

  const handleDeleteSelected = async () => {
    if (selectedProjects.length === 0) return;
    await onDeleteProjects(selectedProjects.map(p => p.id));
    setRowSelection({});
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };


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

        {selectedProjects.length > 0 && (
          <button
            className="inline-flex items-center gap-2 h-9 px-4 bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            onClick={handleDeleteSelected}
            type="button"
          >
            <Trash2 size={16} />
            <span>Delete Selected ({selectedProjects.length})</span>
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
        {projects.length === 0 && !loading ? (
          <div className="py-20 border-y border-transparent">
            {/* Custom Empty State preserved for brand consistency */}
            <div className="flex flex-col items-center justify-center max-w-[400px] mx-auto text-center animate-in fade-in zoom-in duration-500">
              <div className="relative">
                <img
                  src={noDataImage}
                  alt="No Data"
                  className="relative w-100 h-100 mx-auto object-contain opacity-90"
                />
              </div>

              <h3 className="text-xl font-bold text-olive-950 dark:text-white mb-2 tracking-tight">
                {searchTerm ? "No Matches Found" : "Your Directory is Empty"}
              </h3>

              <p className="text-zinc-500 dark:text-slate-400 text-sm mb-8 leading-relaxed px-4">
                {searchTerm
                  ? "We couldn't find any projects matching your current filter. Try adjusting your search term to see more results."
                  : "It looks like you haven't created any projects yet. Start by provisioning a new node for your synchronization workspace."}
              </p>

              <button
                onClick={searchTerm ? () => onSearch('') : onOpenCreateProject}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-olive-900 dark:bg-olive-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-olive-950/20 hover:bg-olive-800 dark:hover:bg-olive-500 transform transition-all active:scale-95 duration-200"
                type="button"
              >
                {searchTerm ? (
                  <>
                    <Search size={16} strokeWidth={2.5} />
                    <span>Clear search filter</span>
                  </>
                ) : (
                  <>
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Create first project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <DataTable
            table={table}
            loading={loading}
            onRowClick={(project) => onOpenProject(project.id)}
            skeletonRows={5}
            pagination={{
              page: currentPage,
              totalPages,
              onPageChange
            }}
          />
        )}
      </div>
    </div>
  );
}

export default ProjectPanel;
