import type { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
}

function Modal({ children, onClose, title }: ModalProps): JSX.Element {
  return (
    <div aria-modal="true" className="modal-backdrop" onClick={onClose} role="dialog">
      <div className="modal-panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button aria-label="Close modal" className="secondary-button modal-close" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
