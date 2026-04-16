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

const statusPillClasses: Record<string, string> = {
  planned:   'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  active:    'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  archived:  'bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

const ghostBtn = 'inline-flex items-center gap-1.5 px-3 py-2 text-[0.8rem] font-medium bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors';
const dangerBtn = 'inline-flex items-center gap-1.5 px-3 py-2 text-[0.8rem] font-medium bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors';

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
    <div className="grid gap-[18px]">
      {/* Intro */}
      <div className="flex items-flex-start justify-between gap-4">
        <div>
          <span className="text-olive-600 dark:text-blue-400 font-['Space_Grotesk'] text-[0.72rem] tracking-[0.12em] uppercase">Epic layer</span>
          <h3 className="my-1 text-olive-950 dark:text-slate-100">{projectName} epics</h3>
          <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">Create, reorder, rename, or remove epics without affecting the underlying tasks.</p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-olive-900 dark:bg-olive-600 text-white rounded text-sm font-medium hover:bg-olive-800 dark:hover:bg-olive-500 transition-colors shrink-0"
          onClick={onCreateEpic}
          type="button"
        >
          <Plus size={16} /> New epic
        </button>
      </div>

      {epics.length === 0 ? (
        <EmptyState
          description="Create an epic to group related tasks inside this project."
          icon={FolderTree}
          title="No epics yet"
        />
      ) : (
        <div className="grid gap-3.5">
          {epics.map((epic, index) => (
            <div
              key={epic.id}
              className="flex items-stretch bg-gradient-to-b from-white/98 to-slate-50/98 dark:from-slate-800/84 dark:to-slate-800/84 border border-zinc-200/60 dark:border-slate-700 rounded-lg grid gap-3 grid-cols-[1fr_auto] p-[18px]"
            >
              {/* Copy */}
              <div className="grid gap-1.5">
                <span className="text-olive-600 dark:text-blue-400 font-['Space_Grotesk'] text-[0.72rem] tracking-[0.12em] uppercase">
                  Epic #{index + 1}
                </span>
                <strong className="text-olive-950 dark:text-slate-100 text-[1.05rem]">{epic.name}</strong>
                <span className="text-zinc-500 dark:text-slate-400 text-sm">
                  {epic.description?.trim() ? epic.description : 'No description provided.'}
                </span>
                <span className={`inline-block self-start rounded text-[0.72rem] font-semibold px-2 py-0.5 mt-0.5 ${statusPillClasses[epic.status] ?? statusPillClasses.planned}`}>
                  {epic.status}
                </span>
              </div>

              {/* Actions */}
              <div className="grid gap-2.5 items-center grid-cols-[repeat(auto-fit,minmax(60px,auto))]">
                <button className={ghostBtn} disabled={index === 0 || actionEpicId === epic.id} onClick={() => void onMoveEpic(epic, 'up')} type="button">
                  <ArrowUp size={16} /> Up
                </button>
                <button className={ghostBtn} disabled={index === epics.length - 1 || actionEpicId === epic.id} onClick={() => void onMoveEpic(epic, 'down')} type="button">
                  <ArrowDown size={16} /> Down
                </button>
                <button className={ghostBtn} disabled={actionEpicId === epic.id} onClick={() => onEditEpic(epic)} type="button">
                  <Pencil size={16} /> Edit
                </button>
                <button className={dangerBtn} disabled={actionEpicId === epic.id} onClick={() => void onDeleteEpic(epic)} type="button">
                  <Trash2 size={16} /> {actionEpicId === epic.id ? 'Deleting...' : 'Delete'}
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
