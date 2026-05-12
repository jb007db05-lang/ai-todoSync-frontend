import type { ComponentPropsWithoutRef, ReactNode } from 'react';

interface SectionCardProps extends ComponentPropsWithoutRef<'section'> {
  children: ReactNode;
  className?: string;
}

function SectionCard({ children, className, ...props }: SectionCardProps): JSX.Element {
  return (
    <section
      {...props}
      className={[
        'bg-white  border border-olive-200',
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