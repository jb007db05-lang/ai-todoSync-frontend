import api from './api';

export interface AnalyticsKey {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  maskedKey: string;
  key?: string; // Only present on creation
}

export interface TrackedEvent {
  id: string;
  eventName: string;
  count: number;
  createdAt: string;
}

export interface EventLog {
  _id: string;
  eventId: string;
  apiKeyId: string;
  userIdentifier?: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface IdentifiedUser {
  _id: string;
  apiKeyId: string;
  userIdentifier: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface RawEvent {
  _id: string;
  userId: string;
  eventName: string;
  timestamp: string;
  properties: Record<string, unknown>;
  sessionId: string;
  payload?: Record<string, unknown>; // Added for raw logs
  context: {
    page?: {
      url: string;
    };
    device?: {
      os: string;
      browser: string;
      screen: string;
      language?: string;
    };
    library?: {
      name: string;
      version: string;
    };
  };
}

export interface EventFilters {
  apiKeyId?: string;
  page?: number;
  limit?: number;
  offset?: number;
  eventName?: string;
  eventNames?: string[];
  startDate?: string;
  endDate?: string;
}

export const createApiKey = async (name: string): Promise<AnalyticsKey> => {
  const response = await api.post('/keys', { name });
  return response.data;
};

export const listApiKeys = async (): Promise<AnalyticsKey[]> => {
  const response = await api.get('/keys');
  return response.data;
};

export const deleteApiKey = async (id: string): Promise<void> => {
  await api.delete(`/keys/${id}`);
};

export const getTrackedEvents = async (apiKeyId: string, filters: Record<string, unknown> = {}): Promise<TrackedEvent[]> => {
  const response = await api.get('/analytics/events', {
    params: { apiKeyId, ...filters },
  });
  return response.data;
};

export const getEventLogs = async (eventId: string, apiKeyId: string): Promise<EventLog[]> => {
  const response = await api.get(`/analytics/events/${eventId}/logs`, {
    params: { apiKeyId },
  });
  return response.data;
};

export const getIdentifiedUsers = async (apiKeyId: string): Promise<IdentifiedUser[]> => {
  const response = await api.get('/analytics/users', {
    params: { apiKeyId },
  });
  return response.data;
};

export const getUserEvents = async (identifier: string, apiKeyId: string): Promise<EventLog[]> => {
  const response = await api.get(`/analytics/users/${identifier}/events`, {
    params: { apiKeyId },
  });
  return response.data;
};

export const getAnalyticsEvents = async (params: EventFilters): Promise<{ events: RawEvent[]; total: number; page: number; totalPages: number }> => {
  const response = await api.get('/analytics/all-logs', { params });
  const data = response.data.data || response.data;
  
  return data || { events: [], total: 0, page: 1, totalPages: 1 };
};
