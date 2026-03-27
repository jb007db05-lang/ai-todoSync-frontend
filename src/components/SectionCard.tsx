import type { ReactNode } from 'react';

interface SectionCardProps {
  children: ReactNode;
}

function SectionCard({ children }: SectionCardProps): JSX.Element {
  return <section className="card">{children}</section>;
}

export default SectionCard;
