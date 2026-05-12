import { ScrollText } from 'lucide-react';

import EmptyState from '@/components/EmptyState';
import type { Note } from '@/types/note';

interface ProjectNotesProps {
  actionNoteId: string | null;
  createLabel?: string;
  emptyDescription?: string;
  emptyTitle?: string;
  heading?: string;
  loading: boolean;
  notes: Note[];
  onCreateNote?: () => void;
  onDeleteNote?: (note: Note) => void;
  onOpenNote: (note: Note) => void;
}

const timestampFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const formatTimestamp = (value?: string): string => {
  if (!value) {
    return 'Just now';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just now' : timestampFormatter.format(date);
};

function ProjectNotes({
  actionNoteId,
  createLabel = 'Create note',
  emptyDescription = 'Create the first note to capture decisions, references, or follow-ups for this project.',
  emptyTitle = 'No notes yet',
  heading = 'Notes',
  loading,
  notes,
  onCreateNote,
  onDeleteNote,
  onOpenNote
}: ProjectNotesProps): JSX.Element {
  return (
    <section className="bg-olive-50/90  border border-olive-200/80  rounded-xl grid gap-4 p-[18px]">
      {/* Header */}
      <div className="flex items-start gap-3 justify-between">
        <div>
          <span className="text-olive-600  text-[0.72rem] tracking-[0.12em] uppercase font-semibold">Notes</span>
          <h3 className="mt-1 mb-0 text-olive-950 ">{heading}</h3>
        </div>
        {onCreateNote ? (
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-olive-900  text-white rounded text-sm font-medium hover:bg-olive-800  transition-colors shrink-0"
            onClick={onCreateNote}
            type="button"
          >
            {createLabel}
          </button>
        ) : null}
      </div>

      {loading ? <p className="text-olive-400  m-0 text-sm">Loading notes...</p> : null}

      {!loading && notes.length === 0 ? (
        <EmptyState compact description={emptyDescription} icon={ScrollText} title={emptyTitle} />
      ) : null}

      {notes.length ? (
        <div className="grid gap-3 max-h-[520px] overflow-auto pr-1">
          {notes.map((note) => (
            <article
              key={note.id}
              className="flex items-stretch bg-white/88  border border-olive-200/80  rounded-lg gap-3 justify-between p-2.5"
            >
              <button
                className="flex flex-col items-start flex-1 gap-1.5 bg-transparent hover:bg-teal-600/6  rounded-xl px-3 py-2.5 text-left transition-colors"
                onClick={() => onOpenNote(note)}
                type="button"
              >
                <strong className="text-olive-950  text-[0.98rem]">{note.title}</strong>
                <span className="text-olive-500  text-[0.86rem]">Updated {formatTimestamp(note.updatedAt)}</span>
              </button>
              {onDeleteNote ? (
                <button
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white  border border-red-200  text-red-600  rounded hover:bg-red-50  disabled:opacity-50 transition-colors self-center"
                  disabled={actionNoteId === note.id}
                  onClick={() => onDeleteNote(note)}
                  type="button"
                >
                  {actionNoteId === note.id ? 'Deleting...' : 'Delete'}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default ProjectNotes;