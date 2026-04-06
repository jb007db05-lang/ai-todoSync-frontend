import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  compact?: boolean;
  description: string;
  icon: LucideIcon;
  title: string;
}

function EmptyState({ compact = false, description, icon: Icon, title }: EmptyStateProps): JSX.Element {
  return (
    <div className={`empty-state-card ${compact ? 'empty-state-card-compact' : ''}`}>
      <div className="empty-state-icon" aria-hidden="true">
        <Icon size={compact ? 18 : 22} />
      </div>
      <div className="empty-state-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default EmptyState;
