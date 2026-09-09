export type GuideType = 'TOUR' | 'SMART_TIP' | 'HOTSPOT' | 'CHECKLIST' | 'BANNER' | 'MODAL' | 'SURVEY';
export type GuideStatus = 'DRAFT' | 'LIVE' | 'PAUSED' | 'ARCHIVED';
export type GuidePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type GuidePlacement = 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' | 'CENTER' | 'AUTO';

export type TargetingConditionType =
  | 'URL_EQUALS'
  | 'URL_CONTAINS'
  | 'URL_REGEX'
  | 'REFERRER_EQUALS'
  | 'REFERRER_CONTAINS'
  | 'ROLE_EQUALS'
  | 'PLAN_EQUALS'
  | 'ACCOUNT_AGE'
  | 'TENANT_EQUALS'
  | 'EVENT_TRIGGERED'
  | 'EVENT_NOT_TRIGGERED'
  | 'RAGE_CLICK_COUNT'
  | 'VISITED_PAGE'
  | 'COMPLETED_WORKFLOW'
  | 'ABANDONED_FORM'
  | 'SESSION_DURATION'
  | 'SESSION_COUNT'
  | 'ENGAGEMENT_SCORE'
  | 'SHOW_ONCE'
  | 'SHOW_EVERY_X_DAYS'
  | 'COOLDOWN'
  | 'TIME_WINDOW'
  | 'EXIT_INTENT'
  | 'IDLE_TIMEOUT';

export interface TargetingCondition {
  id: string;
  type: TargetingConditionType;
  operator?: string;
  value?: unknown;
  eventName?: string;
  property?: string;
  windowDays?: number;
  count?: number;
  metadata?: Record<string, unknown>;
}

export interface TargetingRuleGroup {
  id: string;
  operator: 'AND' | 'OR';
  conditions?: TargetingCondition[];
  groups?: TargetingRuleGroup[];
}

export interface FrequencyRules {
  showOnceEver?: boolean;
  showOncePerSession?: boolean;
  everyXDays?: number;
  maxDisplays?: number;
  cooldownHours?: number;
}

export interface ScheduleRules {
  startsAt?: string | null;
  endsAt?: string | null;
  timezone?: string;
}

export interface GuideStep {
  id: string;
  title: string;
  description?: string;
  selector?: string;
  placement?: GuidePlacement;
  actionType?: string;
  nextStep?: string | null;
  branchConditions?: TargetingRuleGroup | null;
  analytics?: Record<string, unknown>;
  linkedEvent?: string;
  completed?: boolean;
  completedAt?: string | null;
  estimatedMinutes?: number;
  type?: SurveyQuestionType;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
}

export type SurveyQuestionType =
  | 'NPS'
  | 'TEXT'
  | 'TEXTAREA'
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'RATING_SCALE'
  | 'DROPDOWN'
  | 'YES_NO'
  | 'CSAT'
  | 'CES'
  | 'EMOJI'
  | 'OPINION_SCALE'
  | 'FILE_UPLOAD'
  | 'CONTACT';

export interface Guide {
  _id?: string;
  id: string;
  tenantId?: string;
  sdkIntegrationId?: string;
  title: string;
  description?: string;
  type: GuideType;
  status?: GuideStatus;
  theme?: Record<string, unknown>;
  priority: GuidePriority;
  targetingRules?: TargetingRuleGroup | null;
  frequencyRules?: FrequencyRules;
  scheduleRules?: ScheduleRules;
  steps: GuideStep[];
  analytics?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
  eligibility?: {
    reasons: string[];
    matchedConditions: string[];
    failedConditions: string[];
  };
}

export interface EngagementRuntimeContext {
  userId?: string;
  sessionId?: string | null;
  sdkIntegrationId?: string;
  url?: string;
  referrer?: string;
  role?: string;
  plan?: string;
  userProperties?: Record<string, unknown>;
  session?: {
    durationSeconds?: number;
    count?: number;
    engagementScore?: number;
  };
  workflow?: {
    completed?: string[];
  };
  eventName?: string;
  eventProperties?: Record<string, unknown>;
}

export type EngagementEventName =
  | 'guide_shown'
  | 'guide_started'
  | 'guide_completed'
  | 'guide_dismissed'
  | 'step_viewed'
  | 'step_completed'
  | 'step_dropped'
  | 'survey_started'
  | 'survey_completed'
  | 'survey_abandoned'
  | 'banner_clicked'
  | 'hotspot_opened';
