import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

function PageHeader({ title, description, actions }: PageHeaderProps): JSX.Element {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-olive-950 dark:text-slate-100 m-0">{title}</h1>
        {description ? <p className="text-zinc-500 dark:text-slate-400 mt-1">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export default PageHeader;
