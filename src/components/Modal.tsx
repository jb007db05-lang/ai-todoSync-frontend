import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  backdropClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
  onClose: () => void;
  panelClassName?: string;
  title: string;
}

function Modal({ backdropClassName, bodyClassName, children, onClose, panelClassName, title }: ModalProps): JSX.Element {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  if (portalTarget == null) {
    return <></>;
  }

  return createPortal(
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
    </div>,
    portalTarget
  );
}

export default Modal;
