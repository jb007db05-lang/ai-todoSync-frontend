import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';

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

const toolbarBtnBase = 'inline-flex items-center justify-center h-7 px-2.5 rounded text-xs font-semibold bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 text-zinc-700 dark:text-slate-200 hover:bg-zinc-50 dark:hover:bg-slate-600 transition-colors cursor-pointer';

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
  const [fontSize, setFontSize] = useState('3');
  const [textColor, setTextColor] = useState('#1f2937');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const isInternalUpdateRef = useRef(false);

  useEffect(() => {
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '');
    setFontSize('3');
    setTextColor('#1f2937');
    setErrorMessage(null);
    setSubmitting(false);

    if (editorRef.current) {
      editorRef.current.innerHTML = note?.content ?? '';
    }
  }, [note]);

  useEffect(() => {
    if (editorRef.current && !isInternalUpdateRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
    isInternalUpdateRef.current = false;
  }, [content]);

  const syncEditorContent = (): void => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      if (newContent !== content) {
        isInternalUpdateRef.current = true;
        setContent(newContent);
      }
    }
  };

  const applyCommand = (command: string, value?: string): void => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorContent();
  };

  const handleToolbarCommand = (event: MouseEvent<HTMLButtonElement>, command: string, value?: string): void => {
    event.preventDefault();
    applyCommand(command, value);
  };

  const handleFontSizeCommand = (event: MouseEvent<HTMLButtonElement>, value: string): void => {
    event.preventDefault();
    setFontSize(value);
    applyCommand('fontSize', value);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>,
    mode: 'replace' | 'append' = 'replace'
  ): Promise<void> => {
    event.preventDefault();

    if (showTitle && !title.trim()) {
      setErrorMessage('Note title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      let finalContent = content;
      if (editorRef.current) {
        finalContent = editorRef.current.innerHTML;
      }

      await onSave({
        appendContent: mode === 'append',
        title: showTitle ? title.trim() : undefined,
        content: finalContent
      });
    } catch {
      setErrorMessage('Unable to save the note right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      backdropClassName="items-center overflow-y-auto"
      bodyClassName="!p-0"
      onClose={onClose}
      panelClassName="!max-w-[700px] w-full"
      title={modalTitle ?? (note ? 'Edit Note' : 'Create Note')}
    >
      <form className="grid gap-5 p-6" onSubmit={(event) => void handleSubmit(event)}>
        <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">
          Rich text note for {entityLabel}. Use the toolbar to format content before saving.
        </p>

        {showTitle ? (
          <label className="grid gap-2 font-medium text-[0.95rem] text-olive-950 dark:text-slate-100">
            <span>Title</span>
            <input
              className="w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-olive-950 dark:text-slate-100 px-4 py-3.5 transition-all focus:outline-none focus:border-olive-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-olive-500/10"
              onChange={(event) => setTitle(event.target.value)}
              placeholder={titlePlaceholder}
              type="text"
              value={title}
            />
          </label>
        ) : null}

        {/* Editor */}
        <div className="grid gap-2">
          <span className="font-medium text-[0.95rem] text-olive-950 dark:text-slate-100">Content</span>

          <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col min-h-[420px]">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 px-3.5 py-3 bg-zinc-50 dark:bg-slate-800 border-b border-zinc-200 dark:border-slate-700">
              {/* Format cluster */}
              <div className="flex items-center gap-1">
                <button aria-label="Bold" className={`${toolbarBtnBase} font-bold`} onMouseDown={(e) => handleToolbarCommand(e, 'bold')} title="Bold" type="button">B</button>
                <button aria-label="Italic" className={`${toolbarBtnBase} italic`} onMouseDown={(e) => handleToolbarCommand(e, 'italic')} title="Italic" type="button">I</button>
                <button aria-label="Underline" className={`${toolbarBtnBase} underline`} onMouseDown={(e) => handleToolbarCommand(e, 'underline')} title="Underline" type="button">U</button>
              </div>

              <div className="w-px h-5 bg-zinc-200 dark:bg-slate-600" />

              {/* Size cluster */}
              <div className="flex items-center gap-1">
                {(['2', '3', '4', '5', '6'] as const).map((sz, idx) => {
                  const labels = ['XS', 'S', 'M', 'L', 'XL'];
                  return (
                    <button
                      key={sz}
                      aria-label={`${labels[idx]} text`}
                      className={`${toolbarBtnBase} ${fontSize === sz ? 'bg-olive-900 dark:bg-olive-600 text-white dark:text-white border-olive-900 dark:border-blue-600' : ''}`}
                      onMouseDown={(e) => handleFontSizeCommand(e, sz)}
                      title={`${labels[idx]} text`}
                      type="button"
                    >
                      {labels[idx]}
                    </button>
                  );
                })}
                <input
                  aria-label="Text color"
                  className="note-toolbar-color w-7 h-7 rounded cursor-pointer border-none p-0"
                  onChange={(event) => {
                    const value = event.target.value;
                    setTextColor(value);
                    applyCommand('foreColor', value);
                  }}
                  title="Text color"
                  type="color"
                  value={textColor}
                />
              </div>

              <div className="w-px h-5 bg-zinc-200 dark:bg-slate-600" />

              {/* Lists cluster */}
              <div className="flex items-center gap-1">
                <button aria-label="Bulleted list" className={toolbarBtnBase} onMouseDown={(e) => handleToolbarCommand(e, 'insertUnorderedList')} title="Bulleted list" type="button">•</button>
                <button aria-label="Numbered list" className={toolbarBtnBase} onMouseDown={(e) => handleToolbarCommand(e, 'insertOrderedList')} title="Numbered list" type="button">1.</button>
              </div>

              <div className="w-px h-5 bg-zinc-200 dark:bg-slate-600" />

              {/* Indent cluster */}
              <div className="flex items-center gap-1">
                <button aria-label="Outdent" className={toolbarBtnBase} onMouseDown={(e) => handleToolbarCommand(e, 'outdent')} title="Outdent" type="button">←</button>
                <button aria-label="Indent" className={toolbarBtnBase} onMouseDown={(e) => handleToolbarCommand(e, 'indent')} title="Indent" type="button">→</button>
              </div>
            </div>

            {/* Editor surface */}
            <div
              className="note-editor-surface flex-1 p-4 text-olive-900 dark:text-slate-200 text-[0.97rem] leading-relaxed min-h-[340px] overflow-auto"
              contentEditable
              onInput={syncEditorContent}
              ref={editorRef}
              suppressContentEditableWarning
            />
          </div>
        </div>

        {/* Form actions */}
        <div className="flex flex-wrap gap-3 justify-between">
          <button
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-700 dark:text-slate-200 text-sm hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {note && allowDelete && onDelete ? (
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                disabled={submitting}
                onClick={() => void onDelete()}
                type="button"
              >
                {deleteLabel}
              </button>
            ) : null}
            {note && allowAppend ? (
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 text-sm hover:bg-zinc-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                disabled={submitting}
                onClick={(event) => void handleSubmit(event, 'append')}
                type="button"
              >
                {submitting ? 'Appending...' : 'Append'}
              </button>
            ) : null}
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-olive-900 dark:bg-olive-600 text-white rounded text-sm font-medium hover:bg-olive-800 dark:hover:bg-olive-500 disabled:opacity-50 transition-colors"
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {errorMessage ? <p className="text-red-600 dark:text-red-400 m-0 text-[0.9rem]">{errorMessage}</p> : null}
      </form>
    </Modal>
  );
}

export default NoteModal;
