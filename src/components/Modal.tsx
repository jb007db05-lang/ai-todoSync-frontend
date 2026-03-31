import type { ReactNode } from 'react';

interface ModalProps {
  backdropClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
  onClose: () => void;
  panelClassName?: string;
  title: string;
}

function Modal({ backdropClassName, bodyClassName, children, onClose, panelClassName, title }: ModalProps): JSX.Element {
  return (
    <div
      aria-modal="true"
      className={`modal-backdrop${backdropClassName ? ` ${backdropClassName}` : ''}`}
      onClick={onClose}
      role="dialog"
    >
      <div className={`modal-panel${panelClassName ? ` ${panelClassName}` : ''}`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button aria-label="Close modal" className="secondary-button modal-close" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className={`modal-body${bodyClassName ? ` ${bodyClassName}` : ''}`}>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
