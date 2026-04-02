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
      <p className="empty-state compact-empty-state">
        {noteType === 'task'
          ? 'No task notes in this list yet.'
          : noteType === 'subtask'
            ? 'No subtask notes in this list yet.'
            : 'No task or subtask notes in this list yet.'}
      </p>
    );
  }

  return (
    <div className="note-list">
      {entries.map((entry) => (
        <article className="note-list-card" key={entry.id}>
          <button className="note-list-main" onClick={entry.onOpen} type="button">
            <strong>{entry.label}</strong>
            <span>{entry.kind === 'task' ? 'Task note' : 'Subtask note'}</span>
            <span className="task-note-preview">{entry.note.replace(/<[^>]+>/g, ' ').trim() || 'Open note'}</span>
          </button>
        </article>
      ))}
    </div>
  );
}

export default TaskNotesList;
