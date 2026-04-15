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
      className={[
        'fixed inset-0 z-[1000] flex items-center justify-center',
        'bg-zinc-900/40 backdrop-blur-sm p-5',
        backdropClassName ?? ''
      ].join(' ')}
      onClick={onClose}
      role="dialog"
    >
      <div
        className={[
          'relative w-full max-w-[540px] max-h-[90vh] overflow-y-auto',
          'bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700',
          'rounded-lg shadow-sm',
          'animate-modalIn',
          panelClassName ?? ''
        ].join(' ')}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800 rounded-t-lg">
          <h2 className="text-[1.1rem] font-semibold m-0 text-zinc-900 dark:text-slate-100">{title}</h2>
          <button
            aria-label="Close modal"
            className="h-8 px-3 text-[0.8rem] bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-700 dark:text-slate-200 hover:bg-zinc-50 dark:hover:bg-slate-600 transition-colors"
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
