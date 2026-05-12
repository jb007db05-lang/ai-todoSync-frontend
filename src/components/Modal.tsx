import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from "react-icons/md";

interface ModalProps {
  backdropClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
  onClose: () => void;
  panelClassName?: string;
  title: string;
  maxWidth?: string;
}

function Modal({ backdropClassName, bodyClassName, children, onClose, panelClassName, title, maxWidth = 'max-w-[540px]' }: ModalProps): JSX.Element {
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
      className={[
        'fixed inset-0 z-[1000] flex items-center justify-center',
        'bg-olive-900/40 backdrop-blur-sm p-5',
        backdropClassName ?? ''
      ].join(' ')}
      onClick={onClose}
      role="dialog"
    >
      <div
        className={[
          'relative w-full max-h-[90vh] overflow-y-auto',
          maxWidth,
          'bg-white border border-olive-200',
          'rounded-lg shadow-xl',
          'animate-modalIn',
          panelClassName ?? ''
        ].join(' ')}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-olive-200 bg-olive-50 rounded-t-lg">
          <h2 className="text-[1.1rem] font-semibold m-0 text-olive-950">{title}</h2>
          <button
            aria-label="Close modal"
            className="h-8 px-3 text-[0.8rem] bg-white border border-olive-200 rounded text-olive-700 hover:bg-olive-50 transition-colors"
            onClick={onClose}
            type="button"
          >
            <MdClose size={20} />
          </button>
        </div>
        {/* Body */}
        <div className={['p-6 grid gap-5', bodyClassName ?? ''].join(' ')}>{children}</div>
      </div>
    </div>,
    portalTarget
  );
}

export default Modal;