import type { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
  className?: string;
}

function SectionCard({ children, className }: SectionCardProps): JSX.Element {
  return <section className={className ? `card ${className}` : 'card'}>{children}</section>;
}

export default SectionCard;
