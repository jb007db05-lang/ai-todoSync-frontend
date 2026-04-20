import api from './api';

export interface AnalyticsKey {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'revoked';
  createdAt: string;
}

export interface AnalyticsStats {
  totalEvents: number;
  uniqueUsers: number;
  totalSessions: number;
  eventsByDay: { date: string; count: number }[];
  eventsByName: { name: string; count: number }[];
}

export interface RawEvent {
  _id: string;
  eventName: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  properties: Record<string, unknown>;
  context: {
    library?: { name: string; version: string };
    page?: { url: string; referrer: string; title: string };
    device?: { browser: string; os: string; screen: string; language: string };
  };
}

export const getAnalyticsKeys = async (): Promise<AnalyticsKey[]> => {
  const response = await api.get('/analytics/keys');
  return response.data.data.keys;
};

export const generateAnalyticsKey = async (name: string): Promise<AnalyticsKey> => {
  const response = await api.post('/analytics/keys', { name });
  return response.data.data.key;
};

export const revokeAnalyticsKey = async (id: string): Promise<void> => {
  await api.patch(`/analytics/keys/${id}/revoke`);
};

export const regenerateAnalyticsKey = async (id: string): Promise<AnalyticsKey> => {
  const response = await api.patch(`/analytics/keys/${id}/regenerate`);
  return response.data.data.key;
};

export const getAnalyticsStats = async (keyId?: string): Promise<AnalyticsStats> => {
  const response = await api.get('/analytics/stats', {
    params: { keyId }
  });
  return response.data.data.stats;
};

export const getAnalyticsEvents = async (params: { 
  keyId?: string; 
  eventName?: string; 
  limit?: number; 
  offset?: number 
}): Promise<{ events: RawEvent[], total: number }> => {
  const response = await api.get('/analytics/events', { params });
  return response.data.data;
};
