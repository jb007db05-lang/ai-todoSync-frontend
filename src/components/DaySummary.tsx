import type { TaskSummary } from '@/types/task';

interface DaySummaryProps {
  date: string;
  error?: string | null;
  loading?: boolean;
  summary: TaskSummary | null;
}

function DaySummary({ date, error = null, loading = false, summary }: DaySummaryProps): JSX.Element {
  return (
    <div className="summary-block">
      <div className="card-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h2>Daily summary</h2>
          <p className="muted-text">Track progress for {date}.</p>
        </div>
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
            <span>Done</span>
            <strong>{summary.done}</strong>
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
