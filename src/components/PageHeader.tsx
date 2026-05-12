import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

function PageHeader({ title, description, actions }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-olive-950  m-0">{title}</h1>
        {description ? <p className="text-olive-500  mt-1">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export default PageHeader;