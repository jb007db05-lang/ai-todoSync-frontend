import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react';

import Modal from '@/components/Modal';
import type { Note } from '@/types/note';

interface NoteModalProps {
  note?: Note | null;
  onClose: () => void;
  onSave: (payload: { appendContent?: boolean; title: string; content: string }) => Promise<void>;
  projectName: string;
}

function NoteModal({ note = null, onClose, onSave, projectName }: NoteModalProps): JSX.Element {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [fontSize, setFontSize] = useState('3');
  const [textColor, setTextColor] = useState('#1f2937');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTitle(note?.title ?? '');
    setContent(note?.content ?? '');
    setFontSize('3');
    setTextColor('#1f2937');
    setErrorMessage(null);
    setSubmitting(false);
  }, [note]);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

  const syncEditorContent = (): void => {
    setContent(editorRef.current?.innerHTML ?? '');
  };

  const applyCommand = (command: string, value?: string): void => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditorContent();
  };

  const handleToolbarCommand = (
    event: MouseEvent<HTMLButtonElement>,
    command: string,
    value?: string
  ): void => {
    event.preventDefault();
    applyCommand(command, value);
  };

  const handleFontSizeCommand = (event: MouseEvent<HTMLButtonElement>, value: string): void => {
    event.preventDefault();
    setFontSize(value);
    applyCommand('fontSize', value);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    mode: 'replace' | 'append' = 'replace'
  ): Promise<void> => {
    event.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Note title is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      await onSave({
        appendContent: mode === 'append',
        title: title.trim(),
        content
      });
    } catch {
      setErrorMessage('Unable to save the note right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      backdropClassName="note-modal-backdrop"
      bodyClassName="note-modal-body"
      onClose={onClose}
      panelClassName="note-modal-panel"
      title={note ? 'Edit Note' : 'Create Note'}
    >
      <form className="form note-form" onSubmit={(event) => void handleSubmit(event)}>
        <p className="muted-text">Rich text note for {projectName}. Use the toolbar to format content before saving.</p>
        <label>
          <span>Title</span>
          <input
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Sprint recap"
            type="text"
            value={title}
          />
        </label>
        <label>
          <span>Content</span>
          <div className="note-editor-shell">
            <div className="note-editor-toolbar">
              <div className="note-toolbar-cluster">
                <button
                  aria-label="Bold"
                  className="secondary-button note-toolbar-button note-toolbar-icon"
                  onMouseDown={(event) => handleToolbarCommand(event, 'bold')}
                  title="Bold"
                  type="button"
                >
                  B
                </button>
                <button
                  aria-label="Italic"
                  className="secondary-button note-toolbar-button note-toolbar-icon note-toolbar-italic"
                  onMouseDown={(event) => handleToolbarCommand(event, 'italic')}
                  title="Italic"
                  type="button"
                >
                  I
                </button>
                <button
                  aria-label="Underline"
                  className="secondary-button note-toolbar-button note-toolbar-icon note-toolbar-underline"
                  onMouseDown={(event) => handleToolbarCommand(event, 'underline')}
                  title="Underline"
                  type="button"
                >
                  U
                </button>
              </div>
              <div className="note-toolbar-divider" />
              <div className="note-toolbar-cluster">
                <button
                  aria-label="Extra small text"
                  className={`secondary-button note-toolbar-button note-toolbar-size${fontSize === '2' ? ' note-toolbar-active' : ''}`}
                  onMouseDown={(event) => handleFontSizeCommand(event, '2')}
                  title="Extra small text"
                  type="button"
                >
                  XS
                </button>
                <button
                  aria-label="Small text"
                  className={`secondary-button note-toolbar-button note-toolbar-size${fontSize === '3' ? ' note-toolbar-active' : ''}`}
                  onMouseDown={(event) => handleFontSizeCommand(event, '3')}
                  title="Small text"
                  type="button"
                >
                  S
                </button>
                <button
                  aria-label="Body text"
                  className={`secondary-button note-toolbar-button note-toolbar-size${fontSize === '4' ? ' note-toolbar-active' : ''}`}
                  onMouseDown={(event) => handleFontSizeCommand(event, '4')}
                  title="Body text"
                  type="button"
                >
                  M
                </button>
                <button
                  aria-label="Large text"
                  className={`secondary-button note-toolbar-button note-toolbar-size${fontSize === '5' ? ' note-toolbar-active' : ''}`}
                  onMouseDown={(event) => handleFontSizeCommand(event, '5')}
                  title="Large text"
                  type="button"
                >
                  L
                </button>
                <button
                  aria-label="Extra large text"
                  className={`secondary-button note-toolbar-button note-toolbar-size${fontSize === '6' ? ' note-toolbar-active' : ''}`}
                  onMouseDown={(event) => handleFontSizeCommand(event, '6')}
                  title="Extra large text"
                  type="button"
                >
                  XL
                </button>
                <input
                  aria-label="Text color"
                  className="note-toolbar-color"
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
              <div className="note-toolbar-divider" />
              <div className="note-toolbar-cluster">
                <button
                  aria-label="Bulleted list"
                  className="secondary-button note-toolbar-button note-toolbar-icon"
                  onMouseDown={(event) => handleToolbarCommand(event, 'insertUnorderedList')}
                  title="Bulleted list"
                  type="button"
                >
                  •
                </button>
                <button
                  aria-label="Numbered list"
                  className="secondary-button note-toolbar-button note-toolbar-list"
                  onMouseDown={(event) => handleToolbarCommand(event, 'insertOrderedList')}
                  title="Numbered list"
                  type="button"
                >
                  1.
                </button>
              </div>
              <div className="note-toolbar-divider" />
              <div className="note-toolbar-cluster">
                <button
                  aria-label="Outdent"
                  className="secondary-button note-toolbar-button note-toolbar-short"
                  onMouseDown={(event) => handleToolbarCommand(event, 'outdent')}
                  title="Outdent"
                  type="button"
                >
                  ←
                </button>
                <button
                  aria-label="Indent"
                  className="secondary-button note-toolbar-button note-toolbar-short"
                  onMouseDown={(event) => handleToolbarCommand(event, 'indent')}
                  title="Indent"
                  type="button"
                >
                  →
                </button>
              </div>
            </div>
            <div
              className="note-editor-surface"
              contentEditable
              onInput={syncEditorContent}
              ref={editorRef}
              suppressContentEditableWarning
            />
          </div>
        </label>
        <div className="note-form-actions">
          <button className="secondary-button" onClick={onClose} type="button">
            Cancel
          </button>
          {note ? (
            <button
              className="secondary-button note-append-button"
              disabled={submitting}
              onClick={(event) => void handleSubmit(event, 'append')}
              type="button"
            >
              {submitting ? 'Appending...' : 'Append'}
            </button>
          ) : null}
          <button disabled={submitting} onClick={(event) => void handleSubmit(event, 'replace')} type="submit">
            {submitting ? 'Saving...' : 'Save'}
          </button>
        </div>
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </form>
    </Modal>
  );
}

export default NoteModal;
