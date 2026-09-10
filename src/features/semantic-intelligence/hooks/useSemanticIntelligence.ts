import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import {
  compareMetrics,
  drilldownMetric,
  explainMetric,
  getOperationalAnomalies,
  getOperationalTrends,
  getMetricGovernance,
  getMetricLineage,
  getReasoningSummary,
  listMetrics,
  recordDashboardOpened,
  replayTimeline,
  type AdvancedMetricName,
  type MetricExplanation,
  type MetricDefinition,
  type MetricDrilldownResult,
  type MetricName,
  type OperationalAnomaly,
  type OperationalReasoningSummary,
  type OperationalTrend,
  type TimelineReplayEvent,
  type MetricResult,
  type MetricTimeRange,
  type CausalReplayChain,
  type SemanticGovernanceResult,
  type SemanticLineageResult,
  forecastOperationalState,
  simulateOperationalIntervention,
  type OperationalForecast,
  type OperationalSimulation
} from '@/services/semanticAnalytics';
import type { Project } from '@/types/project';

export const dashboardMetrics: MetricName[] = [
  'project_health_score',
  'task_completion_rate',
  'tasks_created',
  'tasks_completed',
  'overdue_tasks',
  'stale_tasks',
  'active_users',
  'avg_completion_time',
  'tasks_completed_per_user',
  'inactive_projects'
];

export const compareMetricsBatchSize = 6;

export const timeRangeOptions: Array<{ value: MetricTimeRange; label: string }> = [
  { value: 'today', label: 'Today' },
  { value: 'last_7_days', label: '7 days' },
  { value: 'last_30_days', label: '30 days' },
  { value: 'last_90_days', label: '90 days' },
  { value: 'all_time', label: 'All time' }
];

export const getValueRecord = (result: MetricResult | undefined): Record<string, unknown> => {
  if (!result || typeof result.value !== 'object' || result.value === null) {
    return {};
  }
  return result.value as Record<string, unknown>;
};

export const getMetricNumber = (result: MetricResult | undefined, keys: string[]): number => {
  const record = getValueRecord(result);
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number') {
      return value;
    }
  }
  return 0;
};

export const formatMetricValue = (result: MetricResult | undefined): string => {
  if (!result) return '--';
  const value = getValueRecord(result);
  if (typeof value.score === 'number') return `${value.score}/100`;
  if (typeof value.percent === 'number') return `${value.percent}%`;
  if (typeof value.averageHours === 'number') return `${value.averageHours}h`;
  if (typeof value.count === 'number') return String(value.count);
  if (Array.isArray(value.rows)) return String(value.rows.length);
  return '--';
};

export const scopedFilters = (
  projectId: string | undefined,
  definition: MetricDefinition | undefined
): { projectId?: string } => {
  if (!projectId || !definition?.allowedFilters.includes('projectId')) {
    return {};
  }
  return { projectId };
};

export function useSemanticIntelligence(
  projects: Project[],
  selectedProjectId: string,
  allProjectsValue: string
) {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [results, setResults] = useState<MetricResult[]>([]);
  const [timeRange, setTimeRange] = useState<MetricTimeRange>('last_30_days');
  const [activeProjectId, setActiveProjectId] = useState(selectedProjectId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<MetricDrilldownResult | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState<MetricName | null>(null);
  const [reasoning, setReasoning] = useState<OperationalReasoningSummary | null>(null);
  const [anomalies, setAnomalies] = useState<OperationalAnomaly[]>([]);
  const [trends, setTrends] = useState<OperationalTrend[]>([]);
  const [timeline, setTimeline] = useState<TimelineReplayEvent[]>([]);
  const [causalChains, setCausalChains] = useState<CausalReplayChain[]>([]);
  const [replayNarrative, setReplayNarrative] = useState('');
  const [replayConfidence, setReplayConfidence] = useState<number | null>(null);
  const [explanation, setExplanation] = useState<MetricExplanation | null>(null);
  const [lineage, setLineage] = useState<SemanticLineageResult | null>(null);
  const [governance, setGovernance] = useState<SemanticGovernanceResult | null>(null);
  const [forecast, setForecast] = useState<OperationalForecast | null>(null);
  const [simulation, setSimulation] = useState<OperationalSimulation | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [projectReport, setProjectReport] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setActiveProjectId(selectedProjectId);
  }, [selectedProjectId]);

  const projectFilter = activeProjectId === allProjectsValue ? undefined : activeProjectId;

  const loadIntelligence = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const definitions = await listMetrics();
      const definitionByName = new Map(definitions.map((definition) => [definition.name, definition]));
      const metricQueries = dashboardMetrics.map((metric) => ({
        metric,
        timeRange,
        filters: scopedFilters(projectFilter, definitionByName.get(metric))
      }));
      const metricQueryBatches = Array.from(
        { length: Math.ceil(metricQueries.length / compareMetricsBatchSize) },
        (_, index) =>
          metricQueries.slice(
            index * compareMetricsBatchSize,
            (index + 1) * compareMetricsBatchSize
          )
      );
      const metricResultBatches = await Promise.all(
        metricQueryBatches.map((batch) => compareMetrics(batch))
      );
      const intelligenceQuery = {
        timeRange,
        filters: projectFilter ? { projectId: projectFilter } : {}
      };
      const [
        summary,
        anomalyResult,
        trendResult,
        replayResult,
        deliveryRiskExplanation,
        lineageResult,
        governanceResult,
        forecastResult
      ] = await Promise.all([
        getReasoningSummary(intelligenceQuery),
        getOperationalAnomalies(intelligenceQuery),
        getOperationalTrends(intelligenceQuery),
        replayTimeline(intelligenceQuery),
        explainMetric({
          ...intelligenceQuery,
          metric: 'delivery_risk' as AdvancedMetricName
        }),
        getMetricLineage('delivery_risk'),
        getMetricGovernance('delivery_risk'),
        forecastOperationalState({
          ...intelligenceQuery,
          metric: 'delivery_risk' as AdvancedMetricName
        })
      ]);
      setMetrics(definitions);
      setResults(metricResultBatches.flat());
      setDrilldown(null);
      setReasoning(summary);
      setAnomalies(anomalyResult.anomalies);
      setTrends(trendResult.trends);
      setTimeline(replayResult.events.slice(-12).reverse());
      setCausalChains(replayResult.causalChains ?? []);
      setReplayNarrative(replayResult.narrative ?? '');
      setReplayConfidence(replayResult.confidence ?? null);
      setExplanation(deliveryRiskExplanation);
      setLineage(lineageResult);
      setGovernance(governanceResult);
      setForecast(forecastResult);

      if (projectFilter) {
        try {
          const reportRes = await api.get<{ report: Record<string, unknown> }>(`/analytics/projects/${projectFilter}/report`);
          setProjectReport(reportRes.data.report);
        } catch {
          setProjectReport(null);
        }
      } else {
        setProjectReport(null);
      }
      void recordDashboardOpened(projectFilter ?? null).catch(() => undefined);
    } catch {
      setError('Unable to load semantic intelligence metrics.');
      setResults([]);
      setReasoning(null);
      setAnomalies([]);
      setTrends([]);
      setTimeline([]);
      setCausalChains([]);
      setReplayNarrative('');
      setReplayConfidence(null);
      setExplanation(null);
      setLineage(null);
      setGovernance(null);
    } finally {
      setLoading(false);
    }
  }, [projectFilter, timeRange]);

  useEffect(() => {
    void loadIntelligence();
  }, [loadIntelligence]);

  const resultByMetric = useMemo(
    () => new Map(results.map((result) => [result.metric, result])),
    [results]
  );
  const metricByName = useMemo(
    () => new Map(metrics.map((metric) => [metric.name, metric])),
    [metrics]
  );

  const openDrilldown = useCallback(
    async (metric: MetricName) => {
      const definition = metricByName.get(metric);
      if (!definition?.drilldownSupport) return;
      setDrilldownLoading(metric);
      setError(null);
      try {
        const nextDrilldown = await drilldownMetric({
          metric,
          timeRange,
          filters: scopedFilters(projectFilter, definition),
          drilldown: definition.allowedDrilldowns[0],
          pagination: { limit: 10, offset: 0 },
          sort: { field: 'updatedAt', direction: 'desc' }
        });
        setDrilldown(nextDrilldown);
      } catch {
        setError('Unable to load semantic drilldown.');
      } finally {
        setDrilldownLoading(null);
      }
    },
    [metricByName, projectFilter, timeRange]
  );

  const runSimulation = useCallback(async (type: OperationalSimulation['intervention']['type']) => {
    setSimulating(true);
    try {
      const result = await simulateOperationalIntervention({
        metric: 'delivery_risk' as AdvancedMetricName,
        timeRange,
        filters: projectFilter ? { projectId: projectFilter } : {},
        intervention: {
          type,
          intensity: 0.8,
        }
      });
      setSimulation(result);
    } catch {
      setError('Failed to run simulation intervention.');
    } finally {
      setSimulating(false);
    }
  }, [projectFilter, timeRange]);

  return {
    metrics,
    results,
    timeRange,
    setTimeRange,
    activeProjectId,
    setActiveProjectId,
    loading,
    error,
    drilldown,
    setDrilldown,
    drilldownLoading,
    reasoning,
    anomalies,
    trends,
    timeline,
    causalChains,
    replayNarrative,
    replayConfidence,
    explanation,
    lineage,
    governance,
    forecast,
    simulation,
    simulating,
    projectReport,
    resultByMetric,
    metricByName,
    openDrilldown,
    runSimulation,
    loadIntelligence
  };
}
