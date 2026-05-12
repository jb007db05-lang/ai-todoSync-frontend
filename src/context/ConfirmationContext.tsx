import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
}

interface ConfirmationContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmationContext = createContext<ConfirmationContextType | undefined>(undefined);

export const ConfirmationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ title: '', message: '' });
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((confirmOptions: ConfirmOptions): Promise<boolean> => {
    setOptions(confirmOptions);
    setIsOpen(true);
    return new Promise((res) => {
      setResolve(() => res);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolve) resolve(true);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolve) resolve(false);
  }, [resolve]);

  return (
    <ConfirmationContext.Provider value={{ confirm }}>
      {children}
      {isOpen && (
        <ConfirmationModal
          title={options.title || (options.type === 'danger' ? 'Are you sure?' : 'Confirmation')}
          message={options.message}
          confirmText={options.confirmText}
          cancelText={options.cancelText}
          type={options.type}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmationContext.Provider>
  );
};

export const useConfirm = () => {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmationProvider');
  }
  return context.confirm;
};