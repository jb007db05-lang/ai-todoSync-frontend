import type { TaskSource } from '@/types/task';

interface SourceBadgeProps {
  source?: TaskSource;
}

const sourceClasses: Record<string, string> = {
  manual:  'bg-olive-50    text-olive-700  border border-olive-200',
  chatgpt: 'bg-olive-50  text-olive-700 border border-olive-200',
  claude:  'bg-purple-50  text-purple-700 border border-purple-200',
  gemini:  'bg-cyan-50    text-cyan-700   border border-cyan-200'
};

function SourceBadge({ source = 'manual' }: SourceBadgeProps): JSX.Element {
  const cls = sourceClasses[source] ?? sourceClasses.manual;
  return (
    <span
      className={`inline-block rounded text-[0.75rem] font-bold px-2.5 py-1 uppercase tracking-[0.05em] ${cls}`}
    >
      {source}
    </span>
  );
}

export default SourceBadge;