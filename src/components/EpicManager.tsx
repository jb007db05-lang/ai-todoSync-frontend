import { ArrowDown, ArrowUp, FolderTree, Pencil, Plus, Trash2 } from 'lucide-react';

import EmptyState from '@/components/EmptyState';
import type { Epic } from '@/types/epic';

interface EpicManagerProps {
  actionEpicId: string | null;
  epics: Epic[];
  onCreateEpic: () => void;
  onDeleteEpic: (epic: Epic) => Promise<void>;
  onEditEpic: (epic: Epic) => void;
  onMoveEpic: (epic: Epic, direction: 'up' | 'down') => Promise<void>;
  projectName: string;
}

function EpicManager({
  actionEpicId,
  epics,
  onCreateEpic,
  onDeleteEpic,
  onEditEpic,
  onMoveEpic,
  projectName
}: EpicManagerProps): JSX.Element {
  return (
    <div className="project-panel">
      <div className="project-panel-intro">
        <div>
          <span className="project-list-kicker">Epic layer</span>
          <h3>{projectName} epics</h3>
          <p className="muted-text">Create, reorder, rename, or remove epics without affecting the underlying tasks.</p>
        </div>
        <button onClick={onCreateEpic} type="button">
          <Plus size={16} />
          New epic
        </button>
      </div>
      {epics.length === 0 ? (
        <EmptyState
          description="Create an epic to group related tasks inside this project."
          icon={FolderTree}
          title="No epics yet"
        />
      ) : (
        <div className="epic-manager-list">
          {epics.map((epic, index) => (
            <div className="epic-manager-card" key={epic.id}>
              <div className="epic-manager-copy">
                <span className="project-list-kicker">Epic #{index + 1}</span>
                <strong>{epic.name}</strong>
                <span className="muted-text">{epic.description?.trim() ? epic.description : 'No description provided.'}</span>
                <span className={`status-pill status-${epic.status}`}>{epic.status}</span>
              </div>
              <div className="epic-manager-actions">
                <button
                  className="secondary-button ghost-button"
                  disabled={index === 0 || actionEpicId === epic.id}
                  onClick={() => void onMoveEpic(epic, 'up')}
                  type="button"
                >
                  <ArrowUp size={16} />
                  Up
                </button>
                <button
                  className="secondary-button ghost-button"
                  disabled={index === epics.length - 1 || actionEpicId === epic.id}
                  onClick={() => void onMoveEpic(epic, 'down')}
                  type="button"
                >
                  <ArrowDown size={16} />
                  Down
                </button>
                <button
                  className="secondary-button ghost-button"
                  disabled={actionEpicId === epic.id}
                  onClick={() => onEditEpic(epic)}
                  type="button"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  className="danger-button ghost-button"
                  disabled={actionEpicId === epic.id}
                  onClick={() => void onDeleteEpic(epic)}
                  type="button"
                >
                  <Trash2 size={16} />
                  {actionEpicId === epic.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default EpicManager;
