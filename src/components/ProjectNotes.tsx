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
  onCreateNote: () => void;
  onDeleteNote: (note: Note) => void;
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
    <section className="notes-panel">
      <div className="notes-panel-header">
        <div>
          <span className="project-list-kicker">Notes</span>
          <h3>{heading}</h3>
        </div>
        <button onClick={onCreateNote} type="button">
          {createLabel}
        </button>
      </div>
      {loading ? <p className="muted-text">Loading notes...</p> : null}
      {!loading && notes.length === 0 ? (
        <EmptyState
          compact
          description={emptyDescription}
          icon={ScrollText}
          title={emptyTitle}
        />
      ) : null}
      {notes.length ? (
        <div className="note-list">
          {notes.map((note) => (
            <article className="note-list-card" key={note.id}>
              <button className="note-list-main" onClick={() => onOpenNote(note)} type="button">
                <strong>{note.title}</strong>
                <span>Updated {formatTimestamp(note.updatedAt)}</span>
              </button>
              <button
                className="danger-button ghost-button"
                disabled={actionNoteId === note.id}
                onClick={() => onDeleteNote(note)}
                type="button"
              >
                {actionNoteId === note.id ? 'Deleting...' : 'Delete'}
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default ProjectNotes;
