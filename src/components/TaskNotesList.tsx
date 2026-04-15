import { FileText } from 'lucide-react';

import EmptyState from '@/components/EmptyState';
import type { Subtask, Task } from '@/types/task';

interface TaskNotesListProps {
  noteType?: 'all' | 'subtask' | 'task';
  onOpenSubtaskNote: (task: Task, subtask: Subtask) => void;
  onOpenTaskNote: (task: Task) => void;
  tasks: Task[];
}

interface TaskNoteEntry {
  id: string;
  kind: 'task' | 'subtask';
  label: string;
  note: string;
  onOpen: () => void;
}

const buildEntries = (
  noteType: 'all' | 'subtask' | 'task',
  tasks: Task[],
  onOpenTaskNote: (task: Task) => void,
  onOpenSubtaskNote: (task: Task, subtask: Subtask) => void
): TaskNoteEntry[] =>
  tasks.flatMap((task) => {
    const entries: TaskNoteEntry[] = [];

    if (noteType !== 'subtask' && task.note?.trim()) {
      entries.push({
        id: `task-${task.id}`,
        kind: 'task',
        label: task.title,
        note: task.note,
        onOpen: () => onOpenTaskNote(task)
      });
    }

    task.subtasks.forEach((subtask) => {
      if (noteType === 'task') {
        return;
      }

      if (!subtask.note?.trim()) {
        return;
      }

      entries.push({
        id: `subtask-${task.id}-${subtask.id}`,
        kind: 'subtask',
        label: `${task.title} / ${subtask.title}`,
        note: subtask.note,
        onOpen: () => onOpenSubtaskNote(task, subtask)
      });
    });

    return entries;
  });

function TaskNotesList({
  noteType = 'all',
  onOpenSubtaskNote,
  onOpenTaskNote,
  tasks
}: TaskNotesListProps): JSX.Element {
  const entries = buildEntries(noteType, tasks, onOpenTaskNote, onOpenSubtaskNote);

  if (entries.length === 0) {
    return (
      <EmptyState
        compact
        description={
          noteType === 'task'
            ? 'Task notes will appear here after you add them from any task.'
            : noteType === 'subtask'
              ? 'Sub-task notes will appear here after you add them from any sub-task.'
              : 'Notes will appear here after you add them to tasks or sub-tasks.'
        }
        icon={FileText}
        title={
          noteType === 'task'
            ? 'No task notes yet'
            : noteType === 'subtask'
              ? 'No sub-task notes yet'
              : 'No notes yet'
        }
      />
    );
  }

  return (
    <div className="grid gap-3 max-h-[520px] overflow-auto pr-1">
      {entries.map((entry) => (
        <article
          key={entry.id}
          className="bg-white/88 dark:bg-slate-800/80 border border-zinc-200/80 dark:border-slate-700 rounded-2xl"
        >
          <button
            className="w-full flex flex-col gap-1.5 px-4 py-3.5 text-left hover:bg-teal-600/6 dark:hover:bg-teal-400/6 rounded-2xl transition-colors"
            onClick={entry.onOpen}
            type="button"
          >
            <strong className="text-zinc-900 dark:text-slate-100 text-[0.98rem]">{entry.label}</strong>
            <span className="inline-block text-[0.72rem] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
              {entry.kind === 'task' ? 'Task note' : 'Subtask note'}
            </span>
            <span className="text-zinc-400 dark:text-slate-500 text-sm truncate">
              {entry.note.replace(/<[^>]+>/g, ' ').trim() || 'Open note'}
            </span>
          </button>
        </article>
      ))}
    </div>
  );
}

export default TaskNotesList;
