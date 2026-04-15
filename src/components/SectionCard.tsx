import type { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
}

function SectionCard({ children, className }: SectionCardProps): JSX.Element {
  return (
    <section
      className={[
        'bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700',
        'rounded-lg shadow-sm p-7',
        'transition-all duration-200 relative overflow-hidden',
        className ?? ''
      ].join(' ')}
    >
      {children}
    </section>
  );
}

export default SectionCard;
