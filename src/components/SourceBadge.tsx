import type { TaskSource } from '@/types/task';

interface SourceBadgeProps {
  source?: TaskSource;
}

const sourceClasses: Record<string, string> = {
  manual:  'bg-blue-50    text-blue-700  border border-blue-200 dark:bg-blue-900/30   dark:text-blue-200  dark:border-blue-800',
  chatgpt: 'bg-indigo-50  text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800',
  claude:  'bg-purple-50  text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800',
  gemini:  'bg-cyan-50    text-cyan-700   border border-cyan-200   dark:bg-cyan-900/30   dark:text-cyan-200   dark:border-cyan-800',
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
