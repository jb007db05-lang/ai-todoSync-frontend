import { FormEvent, useEffect, useState } from 'react';

import Modal from '@/components/Modal';
import type { Note } from '@/types/note';

interface NoteModalProps {
  allowAppend?: boolean;
  allowDelete?: boolean;
  deleteLabel?: string;
  entityLabel: string;
  modalTitle?: string;
  note?: Pick<Note, 'title' | 'content'> | null;
  onClose: () => void;
  onDelete?: () => Promise<void> | void;
  onSave: (payload: { appendContent?: boolean; title?: string; content: string }) => Promise<void>;
  showTitle?: boolean;
  titlePlaceholder?: string;
}

function NoteModal({
  allowAppend = false,
  allowDelete = false,
  deleteLabel = 'Delete',
  entityLabel,
  modalTitle,
  note = null,
  onClose,
  onDelete,
  onSave,
  showTitle = true,
  titlePlaceholder = 'Note title'
}: NoteModalProps): JSX.Element {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '');
    setSubmitting(false);
    setErrorMessage(null);
  }, [note]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
    mode: 'replace' | 'append' = 'replace'
  ): Promise<void> => {
    event.preventDefault();

    if (showTitle && !title.trim()) {
      setErrorMessage('Title is required.');
      return;
    }

    if (!content.trim()) {
      setErrorMessage('Description is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSave({
        appendContent: mode === 'append',
        title: showTitle ? title.trim() : undefined,
        content: content.trim()
      });
    } catch {
      setErrorMessage('Unable to save note right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      backdropClassName="items-center overflow-y-auto"
      onClose={onClose}
      panelClassName="!max-w-[680px] w-full"
      title={modalTitle ?? (note ? 'Edit Note' : 'Create Note')}
    >
      <form className="grid gap-5" onSubmit={(event) => void handleSubmit(event)}>
        <p className="m-0 text-sm text-zinc-500 dark:text-slate-400">
          Capture notes for {entityLabel} with a simple form. Existing save API stays unchanged.
        </p>

        {showTitle ? (
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-olive-950 dark:text-slate-100">Title</span>
            <input
              autoFocus
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-olive-950 shadow-sm transition-colors focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
              onChange={(event) => setTitle(event.target.value)}
              placeholder={titlePlaceholder}
              type="text"
              value={title}
            />
          </label>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-olive-950 dark:text-slate-100">Description</span>
          <textarea
            className="min-h-[240px] w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm leading-6 text-olive-950 shadow-sm transition-colors focus:border-olive-500 focus:outline-none focus:ring-2 focus:ring-olive-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
            onChange={(event) => setContent(event.target.value)}
            placeholder="Write note details, decisions, or follow-ups..."
            value={content}
          />
        </label>

        {errorMessage ? (
          <p className="m-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>

          <div className="flex flex-wrap gap-3">
            {note && allowDelete && onDelete ? (
              <button
                className="inline-flex items-center rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-slate-800 dark:text-red-400 dark:hover:bg-red-900/20"
                disabled={submitting}
                onClick={() => void onDelete()}
                type="button"
              >
                {deleteLabel}
              </button>
            ) : null}

            {note && allowAppend ? (
              <button
                className="inline-flex items-center rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                disabled={submitting}
                onClick={(event) => void handleSubmit(event, 'append')}
                type="button"
              >
                {submitting ? 'Appending...' : 'Append'}
              </button>
            ) : null}

            <button
              className="inline-flex items-center rounded-lg bg-olive-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-olive-800 disabled:opacity-50 dark:bg-olive-600 dark:hover:bg-olive-500"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Saving...' : note ? 'Save changes' : 'Create note'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default NoteModal;
