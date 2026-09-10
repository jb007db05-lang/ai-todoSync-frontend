import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  GitBranch,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow
} from 'lucide-react';
import noDataImg from '@/assets/no_data.png';
import type { Project } from '@/types/project';
import {
  useSemanticIntelligence,
  timeRangeOptions,
  getValueRecord,
  getMetricNumber,
  formatMetricValue
} from '@/features/semantic-intelligence';
import type { MetricName } from '@/services/semanticAnalytics';

interface SemanticIntelligencePageProps {
  projects: Project[];
  selectedProjectId: string;
  allProjectsValue: string;
}

const ScoreRing = ({ score, size = 60, stroke = 5, color = 'var(--color-olive-700)' }: { score: number, size?: number, stroke?: number, color?: string }) => {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="rotate-[-90deg]" height={size} width={size}>
        <circle
          className="text-olive-100"
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth={stroke}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
      <span className="absolute text-[11px] font-semibold text-olive-800">
        {Math.round(score)}
      </span>
    </div>
  );
};

const Sparkline = ({ data }: { data: number[] }) => {
  if (!data || data.length < 2) return null;
  const width = 80;
  const height = 24;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg className="overflow-visible" height={height} width={width}>
      <polyline
        className="text-olive-700/30"
        fill="none"
        points={points}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle
        className="text-olive-700"
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        fill="currentColor"
        r="2"
      />
    </svg>
  );
};

const FactorBar = ({ label, share, color = 'var(--color-olive-700)' }: { label: string, share: number, color?: string }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[11px] font-semibold uppercase tracking-wider">
      <span className="text-olive-500">{label}</span>
      <span className="text-olive-700">{share}%</span>
    </div>
    <div className="h-2 rounded-full bg-olive-100 overflow-hidden">
      <div
        className="h-full transition-all duration-1000 ease-out"
        style={{ width: `${share}%`, backgroundColor: color }}
      />
    </div>
  </div>
);

export default function SemanticIntelligencePage({
  projects,
  selectedProjectId,
  allProjectsValue
}: SemanticIntelligencePageProps): JSX.Element {
  const intel = useSemanticIntelligence(projects, selectedProjectId, allProjectsValue);

  const completion = intel.resultByMetric.get('task_completion_rate');
  const health = intel.resultByMetric.get('project_health_score');
  const perUserRows = (getValueRecord(intel.resultByMetric.get('tasks_completed_per_user')).rows ?? []) as Array<{
    userId: string;
    name?: string | null;
    email?: string;
    count: number;
  }>;
  const healthStatus = String(getValueRecord(health).status ?? 'unknown');
  const maxCompleted = Math.max(...perUserRows.map((row) => row.count), 1);

  if (intel.loading && intel.metrics.length === 0) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-olive-700" size={40} />
          <p className="mt-4 text-sm font-semibold text-olive-500 uppercase tracking-widest">Hydrating Semantic Layer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-olive-50 font-sans">
      {/* Header Panel */}
      <div className="sticky top-0 z-20 px-8 py-4 border-b border-olive-200/60 bg-white/80 backdrop-blur-xl shadow-[0_4px_24px_rgba(63,98,18,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-6 max-w-full mx-auto">
          <div className="flex items-center justify-between w-full gap-3">
            <div className="relative group">
              <select
                className="h-10 pl-10 pr-10 rounded-xl border border-olive-200 bg-white text-xs font-medium text-olive-700 shadow-sm appearance-none focus:ring-4 focus:ring-olive-700/5 focus:border-olive-400 outline-none transition-all cursor-pointer hover:border-olive-300"
                onChange={(event) => intel.setActiveProjectId(event.target.value)}
                value={intel.activeProjectId}
              >
                <option value={allProjectsValue}>All Workspaces</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <Workflow className="absolute left-3.5 top-3 text-olive-500 group-hover:text-olive-700 transition-colors" size={14} />
              <div className="absolute right-3.5 top-3.5 pointer-events-none text-olive-400">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>

            <div className="flex rounded-xl border border-olive-200 bg-olive-50/50 p-1 shadow-inner backdrop-blur-sm">
              {timeRangeOptions.map((option) => (
                <button
                  className={[
                    'h-8 px-4 text-[10px] font-medium uppercase tracking-widest rounded-lg transition-all duration-300',
                    intel.timeRange === option.value
                      ? 'bg-white text-olive-800 shadow-md ring-1 ring-olive-100'
                      : 'text-olive-500 hover:text-olive-800 hover:bg-white/50'
                  ].join(' ')}
                  key={option.value}
                  onClick={() => intel.setTimeRange(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              className={[
                'flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-medium transition-all duration-300 transform active:scale-95 group',
                intel.loading
                  ? 'bg-olive-100 text-olive-400 cursor-not-allowed border border-olive-200'
                  : 'bg-olive-900 text-white shadow-lg shadow-olive-900/20 hover:bg-black hover:shadow-black/25'
              ].join(' ')}
              disabled={intel.loading}
              onClick={() => void intel.loadIntelligence()}
              type="button"
            >
              {intel.loading ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />}
              <span className="tracking-widest uppercase">Sync</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 animate-fadeIn">
        {intel.error ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
            <AlertTriangle size={18} />
            {intel.error}
          </div>
        ) : null}

        {/* Top Metric Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            { metric: 'project_health_score' as MetricName, icon: Gauge, hint: healthStatus.replace(/_/g, ' '), color: 'var(--color-olive-700)' },
            { metric: 'task_completion_rate' as MetricName, icon: CheckCircle2, hint: `${getMetricNumber(completion, ['completed'])} completed`, color: 'var(--color-emerald-600)' },
            { metric: 'overdue_tasks' as MetricName, icon: AlertTriangle, hint: 'open past due date', color: 'var(--color-red-600)' },
            { metric: 'stale_tasks' as MetricName, icon: Clock3, hint: 'not updated in 7 days', color: 'var(--color-amber-600)' }
          ].map(({ metric, icon: Icon, hint, color }) => {
            const result = intel.resultByMetric.get(metric);
            const definition = intel.metricByName.get(metric);
            const scoreValue = typeof getValueRecord(result).score === 'number' ? (getValueRecord(result).score as number) : null;

            return (
              <section
                className="group relative rounded-2xl border border-olive-200 bg-white p-6 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1"
                key={metric}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-olive-400">
                      {result?.label ?? metric.replace(/_/g, ' ')}
                    </p>
                    <h4 className="text-3xl font-semibold text-olive-800 tabular-nums">
                      {formatMetricValue(result)}
                    </h4>
                  </div>
                  {scoreValue !== null ? (
                    <ScoreRing color={color} score={scoreValue} />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-olive-50 text-olive-700">
                      <Icon size={24} />
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-end justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-olive-500 capitalize">{hint}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-md bg-olive-100 px-1.5 py-0.5 text-[9px] font-medium uppercase text-olive-500">
                        <ShieldCheck size={10} />
                        {result?.semantic?.stability ?? definition?.stability ?? 'STABLE'}
                      </span>
                      {definition?.AIVisibility === 'safe' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium uppercase text-emerald-700">
                          AI-SAFE
                        </span>
                      )}
                    </div>
                  </div>
                  <Sparkline data={[40, 35, 55, 45, 60, 50, scoreValue ?? 70]} />
                </div>

                {definition?.drilldownSupport && (
                  <button
                    className="mt-6 w-full flex h-9 items-center justify-center gap-2 rounded-lg border border-olive-100 bg-olive-50 text-[10px] font-medium uppercase tracking-widest text-olive-800 hover:bg-olive-50"
                    disabled={intel.drilldownLoading === metric}
                    onClick={() => void intel.openDrilldown(metric)}
                    type="button"
                  >
                    {intel.drilldownLoading === metric ? <Loader2 className="animate-spin" size={14} /> : <GitBranch size={14} />}
                    Explore Lineage
                  </button>
                )}
              </section>
            );
          })}
        </div>

        {/* Reasoning Panel */}
        {intel.reasoning && (
          <section className="overflow-hidden rounded-3xl border border-olive-200 bg-white shadow-lg">
            <div className="flex flex-col xl:flex-row">
              <div className="flex-1 p-8 space-y-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                      <Sparkles size={20} />
                    </div>
                    <h4 className="text-xl font-semibold text-olive-800">
                      Operational Reasoning
                    </h4>
                  </div>
                  <div className={[
                    'flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-widest ring-1 ring-inset',
                    intel.reasoning.status === 'at_risk'
                      ? 'bg-red-50 text-red-700 ring-red-200'
                      : intel.reasoning.status === 'watch'
                      ? 'bg-amber-50 text-amber-700 ring-amber-200'
                      : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  ].join(' ')}>
                    <Activity size={12} className="animate-pulse" />
                    {intel.reasoning.status.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-lg font-medium leading-relaxed text-olive-700">
                    {intel.reasoning.narrative}
                  </p>
                  {intel.reasoning.causalNarrative && (
                    <div className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-full before:bg-olive-200">
                      <p className="text-sm italic text-olive-500">
                        {intel.reasoning.causalNarrative}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl bg-olive-50/50 p-6 border border-olive-100">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-olive-400 mb-4">Semantic Context</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(intel.reasoning.semanticInterpretation ?? {}).map(([key, value]) => (
                        <span className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-olive-700 shadow-sm border border-olive-100" key={key}>
                          <span className="text-olive-400 mr-1">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                          {value.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-olive-50/50 p-6 border border-olive-100">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-olive-400 mb-4">Governance Recommendations</p>
                    <div className="space-y-3">
                      {(intel.reasoning.recommendations ?? []).slice(0, 3).map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 group">
                          <CheckCircle2 className="mt-0.5 text-olive-600 flex-shrink-0" size={14} />
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-olive-800 leading-tight">{rec}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full xl:w-96 border-t xl:border-t-0 xl:border-l border-olive-200 bg-olive-50/30 p-8">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-olive-400 mb-8">Intelligence Vectors</p>
                <div className="space-y-8">
                  {[
                    { label: 'Delivery Risk', value: intel.reasoning.scores.deliveryRisk, color: '#ef4444' },
                    { label: 'Execution Confidence', value: intel.reasoning.scores.executionConfidence, color: '#10b981' },
                    { label: 'Workflow Friction', value: intel.reasoning.scores.workflowFriction, color: '#f59e0b' },
                    { label: 'Project Momentum', value: intel.reasoning.scores.projectMomentum, color: '#3b82f6' }
                  ].map((item) => (
                    <div key={item.label} className="group flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-olive-600 group-hover:text-olive-800 transition-colors uppercase tracking-tight">
                          {item.label}
                        </p>
                        <div className="h-1.5 w-40 rounded-full bg-olive-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${item.value}%`, backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                      <span className="text-2xl font-semibold text-olive-800 tabular-nums">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Intelligence Grid */}
        <div className="grid gap-8 xl:grid-cols-2">
          {/* Anomalies Panel */}
          <section className="rounded-3xl border border-olive-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <h4 className="text-lg font-semibold text-olive-800">Operational Anomalies</h4>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-olive-400">Threshold: 2.5σ</span>
            </div>

            <div className="space-y-4">
              {intel.anomalies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-olive-50 rounded-2xl border border-dashed border-olive-200">
                  <ShieldCheck size={32} className="text-emerald-500 mb-3" />
                  <p className="text-sm font-semibold text-olive-400">Operational state within expected semantic bounds.</p>
                </div>
              ) : (
                intel.anomalies.slice(0, 4).map((anomaly) => (
                  <div className="relative overflow-hidden group rounded-2xl border border-olive-100 bg-olive-50/50 p-6 transition-all hover:bg-white hover:shadow-md" key={anomaly.metric}>
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-olive-400">{anomaly.metric}</span>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{anomaly.deviation}x deviation</span>
                    </div>
                    <p className="text-sm font-semibold text-olive-800 mb-2">{anomaly.explanation}</p>
                    <p className="text-xs text-olive-500">{anomaly.mitigationHints?.[0] || 'No immediate action required'}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Operational Trends Panel */}
          <section className="rounded-3xl border border-olive-200 bg-white p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                  <TrendingUp size={20} />
                </div>
                <h4 className="text-lg font-semibold text-olive-800">Operational Trends</h4>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-olive-400">Causal Vectors</span>
            </div>

            <div className="space-y-4">
              {intel.trends.slice(0, 4).map((trend) => (
                <div className="p-6 rounded-2xl border border-olive-100 bg-olive-50/50 hover:bg-white transition-all shadow-xs" key={trend.metric}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-olive-800 uppercase tracking-wider">{trend.metric}</span>
                    <span className={`text-xs font-bold ${trend.direction === 'up' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {trend.direction.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-olive-600 mb-3">{trend.interpretation}</p>
                  <div className="flex items-center justify-between text-[11px] text-olive-400 font-mono">
                    <span>Confidence: {Math.round(trend.confidence * 100)}%</span>
                    <span>Delta: {trend.delta}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Explainability & Causal Root Cause Section */}
        {intel.explanation && (
          <section className="rounded-3xl border border-olive-200 bg-white p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-olive-800">Metric Explainability — Delivery Risk</h4>
                  <p className="text-xs text-olive-500">Deconstructed semantic drivers and root cause attribution</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-olive-600 bg-olive-50 px-3 py-1.5 rounded-xl border border-olive-100">
                <ShieldCheck size={14} className="text-emerald-600" />
                Lineage: {intel.lineage?.lineage?.sourceCollections?.join(', ') || 'N/A'}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {intel.explanation.factors.map((factor) => (
                <div key={factor.label} className="p-5 rounded-2xl bg-olive-50/50 border border-olive-100 space-y-3">
                  <FactorBar label={factor.label} share={Math.round(factor.weight * 100)} />
                  <p className="text-xs text-olive-600">{factor.explanation}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Predictive Simulation & Counterfactual Interventions */}
        <section className="rounded-3xl border border-olive-200 bg-white p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-olive-800">Predictive Simulation Engine</h4>
                <p className="text-xs text-olive-500">Simulate counterfactual interventions to evaluate impact prior to execution</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void intel.runSimulation('reduce_blockers')}
                disabled={intel.simulating}
                className="px-4 py-2 bg-olive-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {intel.simulating ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                Simulate Blockers Reduction
              </button>
              <button
                type="button"
                onClick={() => void intel.runSimulation('resolve_overdue')}
                disabled={intel.simulating}
                className="px-4 py-2 bg-white border border-olive-200 text-olive-700 rounded-xl text-xs font-semibold hover:bg-olive-50 transition-colors disabled:opacity-50"
              >
                Simulate Resolving Overdue
              </button>
            </div>
          </div>

          {intel.simulation && (
            <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Intervention Simulation Result</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                  Expected Impact: {intel.simulation.impact > 0 ? `+${intel.simulation.impact}` : intel.simulation.impact} Risk Score
                </span>
              </div>
              <p className="text-sm font-medium text-emerald-900">{intel.simulation.explanation}</p>
            </div>
          )}
        </section>

        {/* User Engagement Performance Grid */}
        <section className="rounded-3xl border border-olive-200 bg-white p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-olive-100 text-olive-700">
                <Database size={20} />
              </div>
              <h4 className="text-lg font-semibold text-olive-800">Team Execution Breakdown</h4>
            </div>
            <span className="text-xs font-mono text-olive-400">{perUserRows.length} active contributors</span>
          </div>

          {perUserRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <img alt="No activity" className="w-32 opacity-40 mb-3" src={noDataImg} />
              <p className="text-xs font-semibold text-olive-400">No contributor records found in this window.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {perUserRows.map((row) => (
                <div key={row.userId} className="p-5 rounded-2xl bg-olive-50/50 border border-olive-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-olive-800">{row.name || row.email || 'User'}</span>
                    <span className="text-xs font-bold text-olive-700 bg-white px-2.5 py-1 rounded-lg shadow-xs border border-olive-100">
                      {row.count} completed
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-olive-100 overflow-hidden">
                    <div
                      className="h-full bg-olive-600 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (row.count / maxCompleted) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Drilldown Modal */}
        {intel.drilldown && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white border border-olive-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-olive-100 pb-4">
                <div>
                  <h4 className="text-lg font-bold text-olive-900 capitalize">{intel.drilldown.metric.replace(/_/g, ' ')} Lineage</h4>
                  <p className="text-xs text-olive-500">Drilldown results: {intel.drilldown.pagination.total} records</p>
                </div>
                <button
                  type="button"
                  onClick={() => intel.setDrilldown(null)}
                  className="p-2 rounded-xl text-olive-400 hover:text-olive-800 hover:bg-olive-50 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-3 custom-scrollbar">
                {intel.drilldown.rows.map((row, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-olive-50/60 border border-olive-100 text-xs space-y-1">
                    <div className="font-bold text-olive-800">{String(row.title || `Record #${idx + 1}`)}</div>
                    <div className="text-olive-500 font-mono text-[11px]">{JSON.stringify(row)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
