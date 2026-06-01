import api from '@/services/api';
import type {
  EngagementEventName,
  EngagementRuntimeContext,
  FrequencyRules,
  Guide,
  GuidePriority,
  GuideStatus,
  GuideStep,
  GuideType,
  ScheduleRules,
  TargetingRuleGroup
} from '@/lib/guides/types';

interface ApiEnvelope<T> {
  data: T;
}

export interface GuidePayload {
  title: string;
  description?: string;
  type: GuideType;
  status?: GuideStatus;
  priority?: GuidePriority;
  targetingRules?: TargetingRuleGroup | null;
  frequencyRules?: FrequencyRules;
  scheduleRules?: ScheduleRules;
  steps?: GuideStep[];
  metadata?: Record<string, unknown>;
}

export interface SurveyPayload {
  title: string;
  description?: string;
  status?: GuideStatus;
  priority?: GuidePriority;
  questions: GuideStep[];
  targetingRules?: TargetingRuleGroup | null;
  triggerRules?: TargetingRuleGroup | null;
  frequencyRules?: FrequencyRules;
  scheduleRules?: ScheduleRules;
  metadata?: Record<string, unknown>;
}

export interface ChecklistPayload {
  title: string;
  description?: string;
  status?: GuideStatus;
  priority?: GuidePriority;
  items: GuideStep[];
  targetingRules?: TargetingRuleGroup | null;
  frequencyRules?: FrequencyRules;
  scheduleRules?: ScheduleRules;
  estimatedMinutes?: number;
  metadata?: Record<string, unknown>;
}

export interface GuideAnalyticsSummary {
  guides: {
    total: number;
    live: number;
    impressions: number;
    completions: number;
    dismissals: number;
    completionRate: number;
    dismissalRate: number;
  };
  surveys: {
    total: number;
    responses: number;
    nps: number;
    promoters: number;
    passives: number;
    detractors: number;
  };
  mtu: {
    month: string;
    users: number;
  };
  events: Array<{ eventName: string; count: number }>;
}

export const listGuides = async (): Promise<Guide[]> => {
  const response = await api.get<ApiEnvelope<{ guides: Guide[] }>>('/guides');
  return response.data.data.guides.map(normalizeGuide);
};

export const createGuide = async (payload: GuidePayload): Promise<Guide> => {
  const response = await api.post<ApiEnvelope<{ guide: Guide }>>('/guides', payload);
  return normalizeGuide(response.data.data.guide);
};

export const updateGuide = async (guideId: string, payload: Partial<GuidePayload>): Promise<Guide> => {
  const response = await api.patch<ApiEnvelope<{ guide: Guide }>>(`/guides/${guideId}`, payload);
  return normalizeGuide(response.data.data.guide);
};

export const updateGuideStatus = async (guideId: string, status: GuideStatus): Promise<Guide> => {
  const response = await api.post<ApiEnvelope<{ guide: Guide }>>(`/guides/${guideId}/status/${status}`);
  return normalizeGuide(response.data.data.guide);
};

export const deleteGuide = async (guideId: string): Promise<void> => {
  await api.delete(`/guides/${guideId}`);
};

export const listSurveys = async (): Promise<Guide[]> => {
  const response = await api.get<ApiEnvelope<{ surveys: Guide[] }>>('/surveys');
  return response.data.data.surveys.map((survey) => normalizeGuide({ ...survey, type: 'SURVEY', steps: survey.steps ?? (survey as Guide & { questions?: GuideStep[] }).questions ?? [] }));
};

export const createSurvey = async (payload: SurveyPayload): Promise<Guide> => {
  const response = await api.post<ApiEnvelope<{ survey: Guide }>>('/surveys', payload);
  return normalizeGuide({ ...response.data.data.survey, type: 'SURVEY', steps: payload.questions });
};

export const updateSurvey = async (surveyId: string, payload: Partial<SurveyPayload>): Promise<Guide> => {
  const response = await api.patch<ApiEnvelope<{ survey: Guide }>>(`/surveys/${surveyId}`, payload);
  return normalizeGuide({ ...response.data.data.survey, type: 'SURVEY', steps: payload.questions ?? [] });
};

export const submitSurveyResponse = async (
  surveyId: string,
  payload: { userId?: string; sessionId?: string | null; answers: Record<string, unknown>; metadata?: Record<string, unknown> }
): Promise<void> => {
  await api.post(`/surveys/${surveyId}/responses`, payload);
};

export const listChecklists = async (): Promise<Guide[]> => {
  const response = await api.get<ApiEnvelope<{ checklists: Guide[] }>>('/checklists');
  return response.data.data.checklists.map((checklist) => normalizeGuide({ ...checklist, type: 'CHECKLIST', steps: checklist.steps ?? (checklist as Guide & { items?: GuideStep[] }).items ?? [] }));
};

export const createChecklist = async (payload: ChecklistPayload): Promise<Guide> => {
  const response = await api.post<ApiEnvelope<{ checklist: Guide }>>('/checklists', payload);
  return normalizeGuide({ ...response.data.data.checklist, type: 'CHECKLIST', steps: payload.items });
};

export const updateChecklist = async (checklistId: string, payload: Partial<ChecklistPayload>): Promise<Guide> => {
  const response = await api.patch<ApiEnvelope<{ checklist: Guide }>>(`/checklists/${checklistId}`, payload);
  return normalizeGuide({ ...response.data.data.checklist, type: 'CHECKLIST', steps: payload.items ?? [] });
};

export const evaluateRuntime = async (context: EngagementRuntimeContext): Promise<Guide[]> => {
  const response = await api.post<ApiEnvelope<{ experiences: Guide[] }>>('/engagement/runtime', context);
  return response.data.data.experiences.map(normalizeGuide);
};

export const trackEngagementEvent = async (payload: {
  eventName: EngagementEventName;
  guideId?: string;
  surveyId?: string;
  checklistId?: string;
  stepId?: string;
  sessionId?: string | null;
  userId?: string;
  properties?: Record<string, unknown>;
}): Promise<void> => {
  await api.post('/engagement/track', payload);
};

export const getGuideAnalyticsSummary = async (): Promise<GuideAnalyticsSummary> => {
  const response = await api.get<ApiEnvelope<GuideAnalyticsSummary>>('/guide-analytics/summary');
  return response.data.data;
};

const normalizeGuide = (guide: Guide & { _id?: string; questions?: GuideStep[]; items?: GuideStep[] }): Guide => ({
  ...guide,
  id: guide.id ?? guide._id ?? '',
  steps: guide.steps ?? guide.questions ?? guide.items ?? [],
  priority: guide.priority ?? 'MEDIUM',
  type: guide.type ?? 'MODAL'
});
