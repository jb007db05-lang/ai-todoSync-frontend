import type { ReactNode } from 'react';

interface ActionGroupProps {
  children: ReactNode;
}

function ActionGroup({ children }: ActionGroupProps): JSX.Element {
  return <div className="action-group">{children}</div>;
}

export default ActionGroup;
