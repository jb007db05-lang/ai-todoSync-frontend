import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  compact?: boolean;
  description: string;
  icon: LucideIcon;
  title: string;
}

function EmptyState({ compact = false, description, icon: Icon, title }: EmptyStateProps): JSX.Element {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center',
        'bg-olive-50  border border-dashed border-olive-200',
        'rounded-xl text-olive-500',
        compact ? 'gap-2.5 p-[18px_16px]' : 'gap-4 p-10'
      ].join(' ')}
    >
      <div
        aria-hidden="true"
        className={[
          'inline-flex items-center justify-center bg-white',
          'border border-olive-200  rounded-md text-olive-600',
          compact ? 'w-9 h-9' : 'w-11 h-11'
        ].join(' ')}
      >
        <Icon size={compact ? 18 : 22} />
      </div>
      <div className="grid gap-1.5 max-w-[520px]">
        <strong className="text-olive-900  text-[0.98rem] tracking-tight">{title}</strong>
        <p className="m-0 text-sm">{description}</p>
      </div>
    </div>
  );
}

export default EmptyState;