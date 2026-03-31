import type { ReactNode } from 'react';
import type { TaskSummary } from '@/types/task';

interface DaySummaryProps {
  controls?: ReactNode;
  date: string;
  error?: string | null;
  loading?: boolean;
  summary: TaskSummary | null;
}

function DaySummary({ controls = null, date, error = null, loading = false, summary }: DaySummaryProps): JSX.Element {
  return (
    <div className="summary-block">
      <div className="summary-header">
        <div className="summary-heading">
          <h2>Daily summary</h2>
          <p className="muted-text">{date}</p>
        </div>
        {controls ? <div className="summary-controls">{controls}</div> : null}
      </div>
      {loading ? <p className="muted-text">Refreshing summary for {date}...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {summary ? (
        <div className="metric-grid">
          <article className="metric-card">
            <span>Total</span>
              <strong>{summary.total}</strong>
          </article>
          <article className="metric-card">
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </article>
          <article className="metric-card">
            <span>In progress</span>
            <strong>{summary.inProgress}</strong>
          </article>
          <article className="metric-card">
            <span>In review</span>
            <strong>{summary.inReview}</strong>
          </article>
          <article className="metric-card">
            <span>Completed</span>
            <strong>{summary.completed}</strong>
          </article>
          <article className="metric-card">
            <span>Rolled over</span>
            <strong>{summary.rolledOver}</strong>
          </article>
        </div>
      ) : !loading && !error ? (
        <p className="empty-state">No summary is available until tasks exist for this date.</p>
      ) : null}
    </div>
  );
}

export default DaySummary;
