import api from './api';

export type MetricName =
  | 'active_users'
  | 'tasks_created'
  | 'tasks_completed'
  | 'task_completion_rate'
  | 'overdue_tasks'
  | 'stale_tasks'
  | 'avg_completion_time'
  | 'project_health_score'
  | 'tasks_completed_per_user'
  | 'inactive_projects';

export type MetricTimeRange = 'today' | 'last_7_days' | 'last_30_days' | 'last_90_days' | 'all_time';

export interface MetricDefinition {
  name: MetricName;
  label: string;
  description: string;
  dimensions: string[];
  allowedFilters: string[];
  allowedDrilldowns: string[];
  semanticType: 'state' | 'event' | 'hybrid';
  stability: 'experimental' | 'stable' | 'deprecated';
  version: string;
  caveats: string[];
  freshnessPolicy: string;
  cachePolicy: {
    ttlSeconds: number;
    strategy: 'live' | 'short_ttl' | 'rollup_ready';
  };
  AIVisibility: 'safe' | 'hidden';
  operationalMeaning: string;
  explainability: string;
  drilldownSupport: boolean;
  contributionStrategy: string;
}

export interface MetricQuery {
  metric: AdvancedMetricName;
  filters?: {
    projectId?: string;
    userId?: string;
  };
  timeRange?: MetricTimeRange;
}

export interface MetricResult {
  metric: MetricName;
  label: string;
  timeRange: MetricTimeRange;
  filters: Record<string, string>;
  value: unknown;
  generatedAt: string;
  semantic?: {
    version: string;
    semanticType: 'state' | 'event' | 'hybrid';
    stability: 'experimental' | 'stable' | 'deprecated';
    freshnessPolicy: string;
    caveats: string[];
    explainability: string;
    operationalMeaning: string;
    AIVisibility: 'safe' | 'hidden';
  };
  cache?: {
    status: 'hit' | 'miss';
    policy: {
      ttlSeconds: number;
      strategy: 'live' | 'short_ttl' | 'rollup_ready';
    };
  };
  trace?: {
    traceId: string;
    durationMs: number;
  };
}

export interface MetricDrilldownRow {
  entityType: string;
  entityId: string;
  title: string;
  projectId: string | null;
  assigneeId: string | null;
  status: string;
  priority: string;
  dueDate: string;
  updatedAt: string;
  createdAt: string;
  reason: string;
  contribution: Record<string, unknown>;
}

export interface MetricDrilldownResult {
  metric: MetricName;
  label: string;
  drilldown: string;
  timeRange: MetricTimeRange;
  filters: Record<string, string>;
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  rows: MetricDrilldownRow[];
  semanticContext: {
    operationalMeaning: string;
    contributionStrategy: string;
    caveats: string[];
  };
  generatedAt: string;
}

export type AdvancedMetricName =
  | MetricName
  | 'workflow_bottlenecks'
  | 'delivery_risk'
  | 'execution_confidence'
  | 'workflow_friction'
  | 'coordination_overhead'
  | 'operational_drift'
  | 'project_momentum'
  | 'velocity_degradation'
  | 'blocker_pressure'
  | 'workflow_instability'
  | 'review_latency'
  | 'reopen_pressure'
  | 'escalation_frequency'
  | 'execution_volatility'
  | 'operational_anomalies'
  | 'throughput_decay'
  | 'workflow_stagnation'
  | 'assignment_churn'
  | 'dependency_pressure';

export interface SemanticFactor {
  key: string;
  label: string;
  value: number;
  weight: number;
  direction: 'positive' | 'negative' | 'neutral';
  explanation: string;
  weightedContribution?: number;
  contributionShare?: number;
}

export interface OperationalReasoningSummary {
  status: 'stable' | 'watch' | 'at_risk';
  scores: {
    deliveryRisk: number;
    executionConfidence: number;
    workflowFriction: number;
    projectMomentum: number;
  };
  narrative: string;
  causalNarrative?: string;
  confidence?: number;
  topFactors: SemanticFactor[];
  anomalies: OperationalAnomaly[];
  propagationAnalysis?: Record<string, unknown>;
  timelineContext?: Record<string, unknown>;
  semanticInterpretation?: Record<string, string>;
  recommendations?: string[];
  generatedAt: string;
}

export interface OperationalAnomaly {
  metric: AdvancedMetricName;
  category?: string;
  score: number;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  currentValue: number;
  baselineValue: number;
  deviation: number;
  explanation: string;
  factors: SemanticFactor[];
  timeline?: Record<string, unknown>;
  operationalImpact?: Record<string, unknown>;
  causality?: Record<string, unknown>;
  historicalComparison?: Record<string, unknown>;
  affectedWorkflows?: string[];
  propagationAnalysis?: Record<string, unknown>;
  mitigationHints?: string[];
}

export interface OperationalTrend {
  metric: AdvancedMetricName;
  currentValue: number;
  previousValue: number;
  baselineValue?: number;
  delta: number;
  direction: 'up' | 'down' | 'flat';
  acceleration?: number;
  degradationVelocity?: number;
  momentumScore?: number;
  directionalConfidence?: number;
  confidence: number;
  volatility?: number;
  stabilization?: boolean;
  recoveryTrajectory?: 'recovering' | 'degrading' | 'stable';
  sustainedDegradation?: boolean;
  baselineComparison?: Record<string, unknown>;
  contributors?: SemanticFactor[];
  causality?: Record<string, unknown>;
  operationalImpact?: Record<string, unknown>;
  interpretation: string;
}

export interface TimelineReplayEvent {
  eventId: string;
  eventName: string;
  entityType: string;
  entityId: string;
  projectId: string | null;
  actorUserId: string;
  occurredAt: string;
  semanticMeaning: string;
  causalSignals: string[];
  workflowContext?: Record<string, unknown>;
  timelineContext?: Record<string, unknown>;
  contributorMetadata?: Record<string, unknown>;
  operationalImpact?: {
    score?: number;
    severity?: 'low' | 'medium' | 'high';
    confidence?: number;
  };
  semanticTags?: string[];
  causality?: Record<string, unknown>;
}

export interface MetricExplanation {
  metric: AdvancedMetricName;
  value: number;
  confidence: number;
  factors: SemanticFactor[];
  contributorWeights?: SemanticFactor[];
  causality?: Record<string, unknown>;
  dependencyAnalysis?: Record<string, unknown>;
  propagationAnalysis?: Record<string, unknown>;
  transitionLatencyAnalysis?: Record<string, unknown>;
  eventCorrelation?: Array<Record<string, unknown>>;
  narrative: string;
  reasoningChain: string[];
  graph: {
    nodes: Array<Record<string, unknown>>;
    edges: Array<Record<string, unknown>>;
  };
  generatedAt: string;
}

export interface CausalReplayChain {
  id: string;
  stages: string[];
  meaning: string;
  confidence: number;
  impact: number;
}

export interface SemanticLineageResult {
  metric: AdvancedMetricName;
  lineage: {
    sourceMetrics: string[];
    sourceEvents: string[];
    sourceCollections: string[];
    transformation: string;
    reasoningOutputs?: string[];
    contributorMetrics?: string[];
    semanticCaveats?: string[];
  };
  relationships?: Record<string, unknown>;
  sourceSignals?: Array<Record<string, unknown>>;
  semanticVersion: string;
  maturityLevel?: string;
  replayCapabilities?: Record<string, unknown>;
  generatedAt: string;
}

export interface SemanticGovernanceResult {
  metric: AdvancedMetricName;
  lifecycleState: string;
  owner: string;
  version: string;
  compatibility: string;
  semanticMaturityLevel?: string;
  freshnessPolicy?: string;
  aiVisibility?: 'safe' | 'hidden';
  explainabilitySupport?: Record<string, unknown>;
  caveats?: string[];
  governedAsset?: Record<string, unknown>;
  lineage: SemanticLineageResult['lineage'];
  relationships?: Record<string, unknown>;
  auditTrail: Array<Record<string, unknown>>;
  generatedAt: string;
}

export interface OperationalForecast {
  metric: AdvancedMetricName;
  horizons: Array<{
    days: number;
    projectedValue: number;
    trajectory: 'improving' | 'degrading' | 'stable';
    confidence: number;
  }>;
  riskDrivers: Array<{
    key: string;
    label: string;
    value: number;
  }>;
  momentum: string;
  propagationRisk: number;
  generatedAt: string;
}

export interface OperationalSimulation {
  metric: AdvancedMetricName;
  intervention: {
    type: 'reduce_blockers' | 'resolve_overdue' | 'increase_throughput' | 'stabilize_ownership';
    intensity: number;
  };
  simulatedValue: number;
  impact: number;
  confidence: number;
  explanation: string;
  generatedAt: string;
}

export const listMetrics = async (): Promise<MetricDefinition[]> => {
  const response = await api.get('/analytics/metrics');
  return response.data.data.metrics;
};

export const queryMetric = async (query: MetricQuery): Promise<MetricResult> => {
  const response = await api.post('/analytics/query-metric', query);
  return response.data.data;
};

export const compareMetrics = async (metrics: MetricQuery[]): Promise<MetricResult[]> => {
  const response = await api.post('/analytics/compare-metrics', { metrics });
  return response.data.data.results;
};

export const drilldownMetric = async (
  query: MetricQuery & {
    drilldown?: string;
    pagination?: { limit?: number; offset?: number };
    sort?: { field?: string; direction?: 'asc' | 'desc' };
  }
): Promise<MetricDrilldownResult> => {
  const response = await api.post('/analytics/drilldown-metric', query);
  return response.data.data;
};

export const getReasoningSummary = async (
  query: Omit<MetricQuery, 'metric'> = {}
): Promise<OperationalReasoningSummary> => {
  const response = await api.post('/analytics/reasoning-summary', query);
  return response.data.data;
};

export const getOperationalAnomalies = async (
  query: Omit<MetricQuery, 'metric'> = {}
): Promise<{ anomalies: OperationalAnomaly[]; generatedAt: string }> => {
  const response = await api.get('/analytics/anomalies', {
    params: { ...query.filters, timeRange: query.timeRange }
  });
  return response.data.data;
};

export const getOperationalTrends = async (
  query: Omit<MetricQuery, 'metric'> = {}
): Promise<{ trends: OperationalTrend[]; generatedAt: string }> => {
  const response = await api.get('/analytics/trends', {
    params: { ...query.filters, timeRange: query.timeRange }
  });
  return response.data.data;
};

export const explainMetric = async (
  query: Omit<MetricQuery, 'metric'> & { metric: AdvancedMetricName }
): Promise<MetricExplanation> => {
  const response = await api.post('/analytics/explain-metric', query);
  return response.data.data;
};

export const replayTimeline = async (
  query: Omit<MetricQuery, 'metric'> = {}
): Promise<{
  events: TimelineReplayEvent[];
  causalChains?: CausalReplayChain[];
  narrative?: string;
  propagationGraph?: Record<string, unknown>;
  confidence?: number;
  summary: Record<string, unknown>;
  generatedAt: string;
}> => {
  const response = await api.post('/analytics/replay-timeline', query);
  return response.data.data;
};

export const getMetricLineage = async (
  metric: AdvancedMetricName
): Promise<SemanticLineageResult> => {
  const response = await api.get(`/analytics/lineage/${metric}`);
  return response.data.data;
};

export const getMetricGovernance = async (
  metric: AdvancedMetricName
): Promise<SemanticGovernanceResult> => {
  const response = await api.get(`/analytics/governance/${metric}`);
  return response.data.data;
};

export const recordDashboardOpened = async (projectId?: string | null): Promise<void> => {
  await api.post('/analytics/dashboard-opened', { projectId: projectId ?? null });
};

export const forecastOperationalState = async (query: MetricQuery): Promise<OperationalForecast> => {
  const response = await api.post('/analytics/forecast', query);
  return response.data.data;
};

export const simulateOperationalIntervention = async (params: {
  metric: string;
  timeRange: MetricTimeRange;
  filters: Record<string, string>;
  intervention: OperationalSimulation['intervention'];
}): Promise<OperationalSimulation> => {
  const response = await api.post('/analytics/simulate', params);
  return response.data.data;
};

// ─────────────────────────────────────────────────────────────
// MCP TOOL CLIENTS
// ─────────────────────────────────────────────────────────────

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  aiSafe: boolean;
}

export interface McpManifest {
  tools: McpTool[];
  protocolVersion: string;
  serverName: string;
  semanticLayer: string;
  note: string;
}

export const listMcpTools = async (): Promise<McpManifest> => {
  const response = await api.get('/mcp/tools');
  return response.data.data;
};

export const callMcpTool = async (toolName: string, input: Record<string, unknown>): Promise<unknown> => {
  const response = await api.post(`/mcp/tools/${toolName}`, input);
  return response.data.data;
};
