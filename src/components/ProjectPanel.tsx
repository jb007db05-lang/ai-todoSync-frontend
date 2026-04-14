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
      // Don't propagate or prevent default if it's the checkbox itself being clicked
      // but we need to manage state
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

  return (
    <div className="project-panel">
      <div className="project-toolbar-refined">
        <div className="pane-header-content">
          <h4 className="pane-section-title" style={{ margin: 0 }}>Project Directory</h4>
          <span className="user-email" style={{ fontSize: '0.75rem' }}>Full Workspace Management</span>
        </div>
        
        <div className="divider-h" style={{ height: 24, margin: '0 8px' }} />

        <div className="search-group">
          <Search size={14} className="search-icon" />
          <input
            className="search-input"
            onChange={handleSearchChange}
            placeholder="Filter projects..."
            type="text"
            value={searchTerm}
          />
        </div>
        
        {selectedIds.size > 0 && (
          <button 
            className="danger-button" 
            onClick={handleDeleteSelected} 
            style={{ height: 36, padding: '0 16px', gap: 8 }} 
            type="button"
          >
            <Trash2 size={16} />
            <span>Delete Selected ({selectedIds.size})</span>
          </button>
        )}

        <button className="primary-button" onClick={onOpenCreateProject} style={{ height: 36, padding: '0 16px', gap: 8 }} type="button">
          <Plus size={16} />
          <span>New project</span>
        </button>
      </div>

      <div className="project-table-container">
        <table className="project-data-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input 
                  checked={isAllSelected}
                  className="project-checkbox"
                  onChange={handleSelectAll}
                  ref={el => el && (el.indeterminate = isSomeSelected)}
                  type="checkbox"
                />
              </th>
              <th style={{ width: '50%' }}>Project</th>
              <th style={{ width: '25%' }}>Tasks</th>
              <th style={{ width: '25%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="muted-text" colSpan={3} style={{ textAlign: 'center', padding: '32px 0' }}>Refreshing projects...</td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td className="muted-text" colSpan={3} style={{ textAlign: 'center', padding: '32px 0' }}>
                  {searchTerm ? 'No projects match your search.' : 'No projects found.'}
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr 
                  className={selectedIds.has(project.id) ? 'row-selected' : ''}
                  key={project.id} 
                  onClick={() => onOpenProject(project.id)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input 
                      checked={selectedIds.has(project.id)}
                      className="project-checkbox"
                      onChange={() => handleSelectRow(project.id, { type: 'change' } as any)}
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <div className="project-name-cell">
                      <FolderKanban size={14} className="accent-blue" />
                      <div className="stack" style={{ gap: '2px' }}>
                        <strong>{project.name}</strong>
                        {project.description && <span className="muted-text small-text truncate" style={{ fontSize: '0.75rem' }}>{project.description}</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="status-pill status-pending">{tasksByProject.get(project.id) ?? 0}</span>
                  </td>
                  <td>
                    <div className="action-cell">
                      <button
                        className="row-action-btn btn-epics"
                        onClick={(e) => { e.stopPropagation(); onOpenEpicManager(project); }}
                        title="Epics"
                        type="button"
                      >
                        <Layers3 size={14} />
                      </button>
                      <button
                        className="row-action-btn btn-edit"
                        onClick={(e) => { e.stopPropagation(); onOpenUpdateProject(project); }}
                        title="Edit project"
                        type="button"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="row-action-btn btn-delete"
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

      <div className="pagination-footer">
        <div className="pagination-info">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
        </div>
        <div className="pagination-controls">
            <button
              className="secondary-button"
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="secondary-button"
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
