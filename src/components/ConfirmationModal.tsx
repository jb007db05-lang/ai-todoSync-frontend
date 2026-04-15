import { AlertCircle, HelpCircle } from 'lucide-react';
import Modal from './Modal';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const isDanger = type === 'danger';

  return (
    <Modal onClose={onCancel} title={title}>
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex items-start gap-4">
          <div className={[
            "w-12 h-12 flex items-center justify-center rounded-lg shrink-0",
            isDanger 
              ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
              : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          ].join(' ')}>
            {isDanger ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
          </div>
          <div className="flex-1 pt-1">
            <p className="text-zinc-600 dark:text-slate-400 leading-relaxed m-0 text-[0.95rem]">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-slate-800">
          <button
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-600 dark:text-slate-300 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
            disabled={isLoading}
            onClick={onCancel}
            type="button"
          >
            {cancelText}
          </button>
          <button
            className={[
              "px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2",
              isDanger 
                ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" 
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
            ].join(' ')}
            disabled={isLoading}
            onClick={onConfirm}
            type="button"
          >
            {isLoading && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
