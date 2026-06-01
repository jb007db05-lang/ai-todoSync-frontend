import api from '@/services/api';
import type { SlaAnalyticsSummary, SlaConfig, TaskPriority } from '@/types/task';

interface SlaConfigListResponse {
  message: string;
  data: {
    configs: SlaConfig[];
  };
}

interface SlaConfigResponse {
  message: string;
  data: {
    config: SlaConfig;
  };
}

interface SlaAnalyticsResponse {
  message: string;
  data: {
    summary: SlaAnalyticsSummary;
  };
}

const getSlaConfigs = async (): Promise<SlaConfig[]> => {
  const response = await api.get<SlaConfigListResponse>('/sla/config');
  return response.data.data.configs;
};

const updateSlaConfig = async (payload: {
  priority: TaskPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
}): Promise<SlaConfig> => {
  const response = await api.patch<SlaConfigResponse>('/sla/config', payload);
  return response.data.data.config;
};

const getSlaAnalytics = async (): Promise<SlaAnalyticsSummary> => {
  const response = await api.get<SlaAnalyticsResponse>('/sla/analytics');
  return response.data.data.summary;
};

export { getSlaAnalytics, getSlaConfigs, updateSlaConfig };
