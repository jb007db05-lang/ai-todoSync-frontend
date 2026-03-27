import type { TaskSource } from '@/types/task';

interface SourceBadgeProps {
  source?: TaskSource;
}

function SourceBadge({ source = 'manual' }: SourceBadgeProps): JSX.Element {
  return <span className={`source-badge source-${source}`}>{source}</span>;
}

export default SourceBadge;
