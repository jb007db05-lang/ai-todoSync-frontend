import type { Project } from '@/types/project';
import { FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';

import EmptyState from '@/components/EmptyState';

interface ProjectPanelProps {
  actionProjectId: string | null;
  loading: boolean;
  onOpenCreateProject: () => void;
  onOpenProject: (projectId: string | null) => void;
  onOpenUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => Promise<void>;
  projects: Project[];
  tasksByProject: Map<string | null, number>;
}

function ProjectPanel({
  actionProjectId,
  loading,
  onOpenCreateProject,
  onOpenProject,
  onOpenUpdateProject,
  onDeleteProject,
  projects,
  tasksByProject
}: ProjectPanelProps): JSX.Element {
  return (
    <div className="project-panel">
      <div className="panel-intro">
      </div>
      <div className="project-toolbar">
        <h2>Projects</h2>
        <button onClick={onOpenCreateProject} type="button">
          <Plus size={16} />
          New project
        </button>
      </div>
      {loading ? <p className="muted-text">Refreshing projects...</p> : null}
      {!loading && projects.length === 0 && (tasksByProject.get(null) ?? 0) === 0 ? (
        <EmptyState
          description="Create a project to organize work into focused execution lanes."
          icon={FolderKanban}
          title="No projects yet"
        />
      ) : null}
      {projects.length || (tasksByProject.get(null) ?? 0) > 0 ? (
        <div className="project-grid">
          {projects.map((project) => (
            <div className="project-list-card" key={project.id}>
              <button className="project-list-main" onClick={() => onOpenProject(project.id)} type="button">
                <span className="project-list-kicker">Project</span>
                <span className="project-list-icon"><FolderKanban size={16} /></span>
                <strong>{project.name}</strong>
                <span>{tasksByProject.get(project.id) ?? 0} task(s)</span>
              </button>
              <div className="project-list-actions">
                <button
                  className="secondary-button ghost-button"
                  disabled={actionProjectId === project.id}
                  onClick={() => onOpenUpdateProject(project)}
                  type="button"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  className="danger-button ghost-button"
                  disabled={actionProjectId === project.id}
                  onClick={() => void onDeleteProject(project.id)}
                  type="button"
                >
                  <Trash2 size={16} />
                  {actionProjectId === project.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default ProjectPanel;
