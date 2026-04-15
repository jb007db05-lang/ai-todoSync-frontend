import type { ReactNode } from 'react';

interface ActionGroupProps {
  children: ReactNode;
}

function ActionGroup({ children }: ActionGroupProps): JSX.Element {
  return (
    <div className="flex flex-wrap gap-3 mt-5 border-t border-zinc-200 dark:border-slate-700 pt-4">
      {children}
    </div>
  );
}

export default ActionGroup;
