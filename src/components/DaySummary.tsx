import type { ReactNode } from 'react';
import type { TaskSummary } from '@/types/task';

interface DaySummaryProps {
  controls?: ReactNode;
  date: string;
  error?: string | null;
  loading?: boolean;
  summary: TaskSummary | null;
}

const metricColors = [
  'text-blue-600 dark:text-blue-400',
  'text-amber-600 dark:text-amber-400',
  'text-cyan-600 dark:text-cyan-400',
  'text-violet-600 dark:text-violet-400',
  'text-teal-600 dark:text-teal-400',
  'text-rose-600 dark:text-rose-400',
];

function DaySummary({ controls = null, date, error = null, loading = false, summary }: DaySummaryProps): JSX.Element {
  const metrics = summary
    ? [
        { label: 'Total',       value: summary.total },
        { label: 'Pending',     value: summary.pending },
        { label: 'In progress', value: summary.inProgress },
        { label: 'In review',   value: summary.inReview },
        { label: 'Completed',   value: summary.completed },
        { label: 'Rolled over', value: summary.rolledOver },
      ]
    : [];

  return (
    <div className="grid gap-3.5 h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-1.5">
        <div className="grid gap-1.5">
          <h2 className="text-xl font-semibold text-olive-950 dark:text-slate-100 m-0">Daily summary</h2>
          <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">{date}</p>
        </div>
        {controls ? <div className="shrink-0 max-w-full">{controls}</div> : null}
      </div>

      {loading ? <p className="text-zinc-400 dark:text-slate-500 m-0 text-sm">Refreshing summary for {date}...</p> : null}
      {error ? <p className="text-red-600 dark:text-red-400 m-0 text-sm">{error}</p> : null}

      {/* Metric grid */}
      {summary ? (
        <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          {metrics.map(({ label, value }, i) => (
            <article
              key={label}
              className="bg-white/46 dark:bg-slate-800/72 border border-zinc-200 dark:border-slate-700 rounded-lg p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:bg-white/68 dark:hover:bg-slate-800/82"
            >
              <span className="text-zinc-500 dark:text-slate-400 text-[0.9rem] uppercase tracking-[0.05em] font-semibold">
                {label}
              </span>
              <strong className={`block text-[2.25rem] font-extrabold font-['Outfit'] mt-2 ${metricColors[i]}`}>
                {value}
              </strong>
            </article>
          ))}
        </div>
      ) : !loading && !error ? (
        <p className="bg-zinc-50 dark:bg-slate-800/50 border border-dashed border-zinc-200 dark:border-slate-700 rounded-md text-zinc-400 dark:text-slate-500 p-6 text-center m-0">
          No summary is available until tasks exist for this date.
        </p>
      ) : null}
    </div>
  );
}

export default DaySummary;
