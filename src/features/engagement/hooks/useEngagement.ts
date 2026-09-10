import { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  getGuideAnalyticsSummary,
  listChecklists,
  listGuides,
  listSurveys,
  updateChecklist,
  updateGuideStatus,
  updateSurvey,
  type GuideAnalyticsSummary,
} from '@/lib/engagement/api';
import { listIntegrations, type SdkIntegration } from '@/lib/sdk-integrations/api';
import type {
  FrequencyRules,
  Guide,
  GuidePriority,
  GuideType,
  TargetingConditionType,
  TargetingRuleGroup
} from '@/lib/guides/types';

export type BuilderTab = 'guides' | 'surveys' | 'checklists' | 'analytics';

export const defaultRules = (): TargetingRuleGroup => ({
  id: crypto.randomUUID(),
  operator: 'AND',
  conditions: [],
  groups: []
});

export const defaultFrequency: FrequencyRules = {
  showOncePerSession: true,
  cooldownHours: 24,
  maxDisplays: 5
};

export const conditionTypes: TargetingConditionType[] = [
  'URL_CONTAINS',
  'URL_EQUALS',
  'URL_REGEX',
  'REFERRER_EQUALS',
  'REFERRER_CONTAINS',
  'ROLE_EQUALS',
  'PLAN_EQUALS',
  'ACCOUNT_AGE',
  'TENANT_EQUALS',
  'EVENT_TRIGGERED',
  'EVENT_NOT_TRIGGERED',
  'RAGE_CLICK_COUNT',
  'VISITED_PAGE',
  'COMPLETED_WORKFLOW',
  'ABANDONED_FORM',
  'SESSION_DURATION',
  'SESSION_COUNT',
  'ENGAGEMENT_SCORE',
  'SHOW_ONCE',
  'SHOW_EVERY_X_DAYS',
  'COOLDOWN',
  'TIME_WINDOW',
  'EXIT_INTENT',
  'IDLE_TIMEOUT'
];

export const conditionLabels: Record<TargetingConditionType, string> = {
  URL_CONTAINS: 'URL contains',
  URL_EQUALS: 'URL equals',
  URL_REGEX: 'URL matches regex',
  REFERRER_EQUALS: 'Referrer equals',
  REFERRER_CONTAINS: 'Referrer contains',
  ROLE_EQUALS: 'Role equals',
  PLAN_EQUALS: 'Plan equals',
  ACCOUNT_AGE: 'Account age (days) ≥',
  TENANT_EQUALS: 'Tenant ID equals',
  EVENT_TRIGGERED: 'Event triggered',
  EVENT_NOT_TRIGGERED: 'Event NOT triggered',
  RAGE_CLICK_COUNT: 'Rage click count ≥',
  VISITED_PAGE: 'Visited page',
  COMPLETED_WORKFLOW: 'Completed workflow',
  ABANDONED_FORM: 'Abandoned form selector',
  SESSION_DURATION: 'Session duration (s) ≥',
  SESSION_COUNT: 'Session count ≥',
  ENGAGEMENT_SCORE: 'Engagement score ≥',
  SHOW_ONCE: 'Show once ever',
  SHOW_EVERY_X_DAYS: 'Show every X days',
  COOLDOWN: 'Cooldown (hours)',
  TIME_WINDOW: 'Time window',
  EXIT_INTENT: 'Exit intent',
  IDLE_TIMEOUT: 'Idle timeout'
};

export const conditionPlaceholders: Partial<Record<TargetingConditionType, string>> = {
  URL_CONTAINS: 'e.g. /dashboard',
  URL_EQUALS: 'e.g. https://app.example.com/home',
  URL_REGEX: 'e.g. /projects/[0-9]+',
  REFERRER_EQUALS: 'e.g. https://google.com',
  REFERRER_CONTAINS: 'e.g. google.com',
  ROLE_EQUALS: 'e.g. ADMIN',
  PLAN_EQUALS: 'e.g. pro',
  ACCOUNT_AGE: 'e.g. 7',
  TENANT_EQUALS: 'e.g. tenant-id',
  EVENT_TRIGGERED: 'e.g. project_created',
  EVENT_NOT_TRIGGERED: 'e.g. onboarding_complete',
  RAGE_CLICK_COUNT: 'e.g. 3',
  VISITED_PAGE: 'e.g. /pricing',
  COMPLETED_WORKFLOW: 'e.g. onboarding',
  ABANDONED_FORM: 'e.g. #signup-form',
  SESSION_DURATION: 'e.g. 30',
  SESSION_COUNT: 'e.g. 3',
  ENGAGEMENT_SCORE: 'e.g. 50',
  SHOW_EVERY_X_DAYS: 'e.g. 7',
  COOLDOWN: 'e.g. 24',
  TIME_WINDOW: 'e.g. 09:00-17:00'
};

export const guideTypes: GuideType[] = ['MODAL', 'TOUR', 'SMART_TIP', 'HOTSPOT', 'BANNER'];
export const priorities: GuidePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export function useEngagement(
  propSdkIntegrationId?: string,
  defaultTab?: BuilderTab
) {
  const { integrationId } = useParams();
  const [activeIntegrationId, setActiveIntegrationId] = useState<string>('');
  const [integrations, setIntegrations] = useState<SdkIntegration[]>([]);
  const [tab, setTab] = useState<BuilderTab>(defaultTab ?? 'guides');
  const [guides, setGuides] = useState<Guide[]>([]);
  const [surveys, setSurveys] = useState<Guide[]>([]);
  const [checklists, setChecklists] = useState<Guide[]>([]);
  const [analytics, setAnalytics] = useState<GuideAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [selectedSurveyForResponses, setSelectedSurveyForResponses] = useState<Guide | null>(null);
  const [isResponsesModalOpen, setIsResponsesModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Guide | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<'guide' | 'survey' | 'checklist'>('guide');
  const [publishingExperience, setPublishingExperience] = useState<Guide | null>(null);

  useEffect(() => {
    if (defaultTab) {
      setTab(defaultTab);
    }
  }, [defaultTab]);

  useEffect(() => {
    const resolvedId = propSdkIntegrationId ?? integrationId;
    if (resolvedId) {
      setActiveIntegrationId(resolvedId);
    } else {
      const fetchIntegrations = async () => {
        try {
          const list = await listIntegrations();
          setIntegrations(list);
          if (list.length > 0) {
            setActiveIntegrationId(list[0].id);
          }
        } catch (err) {
          console.error('Failed to load integrations', err);
        }
      };
      void fetchIntegrations();
    }
  }, [propSdkIntegrationId, integrationId]);

  const load = useCallback(async () => {
    if (!activeIntegrationId) return;
    setLoading(true);
    try {
      const [guideList, surveyList, checklistList, summary] = await Promise.all([
        listGuides(activeIntegrationId),
        listSurveys(activeIntegrationId),
        listChecklists(),
        getGuideAnalyticsSummary(activeIntegrationId)
      ]);
      setGuides(guideList);
      setSurveys(surveyList);
      setChecklists(checklistList);
      setAnalytics(summary);
    } catch (error) {
      console.error('Failed to load engagement data', error);
    } finally {
      setLoading(false);
    }
  }, [activeIntegrationId]);

  useEffect(() => {
    if (activeIntegrationId) {
      localStorage.setItem('active_sdk_integration_id', activeIntegrationId);
      window.dispatchEvent(new CustomEvent('sync:active-integration-changed', { detail: { id: activeIntegrationId } }));
      void load();
    }
  }, [activeIntegrationId, load]);

  const executeStatusChange = async (experience: Guide, status: 'LIVE' | 'PAUSED' | 'ARCHIVED') => {
    if (experience.type === 'SURVEY') {
      await updateSurvey(activeIntegrationId, experience.id, { status });
      setMessage(`Survey ${status.toLowerCase()}.`);
    } else if (experience.type === 'CHECKLIST') {
      await updateChecklist(experience.id, { status });
      setMessage(`Checklist ${status.toLowerCase()}.`);
    } else {
      await updateGuideStatus(activeIntegrationId, experience.id, status);
      setMessage(`Guide ${status.toLowerCase()}.`);
    }
    await load();
  };

  const handleStatusChangeRequest = async (experience: Guide, status: 'LIVE' | 'PAUSED' | 'ARCHIVED') => {
    if (status === 'LIVE') {
      setPublishingExperience(experience);
    } else {
      await executeStatusChange(experience, status);
    }
  };

  const totals = useMemo(
    () => ({
      live: [...guides, ...surveys, ...checklists].filter((item) => item.status === 'LIVE').length,
      drafts: [...guides, ...surveys, ...checklists].filter((item) => item.status === 'DRAFT').length
    }),
    [checklists, guides, surveys]
  );

  return {
    activeIntegrationId,
    setActiveIntegrationId,
    integrations,
    tab,
    setTab,
    guides,
    surveys,
    checklists,
    analytics,
    loading,
    message,
    setMessage,
    selectedSurveyForResponses,
    setSelectedSurveyForResponses,
    isResponsesModalOpen,
    setIsResponsesModalOpen,
    editingExperience,
    setEditingExperience,
    isEditModalOpen,
    setIsEditModalOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createModalType,
    setCreateModalType,
    publishingExperience,
    setPublishingExperience,
    load,
    executeStatusChange,
    handleStatusChangeRequest,
    totals
  };
}
