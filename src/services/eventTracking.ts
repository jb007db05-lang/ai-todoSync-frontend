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

export const getAnalyticsEvents = async (params: {
  apiKeyId?: string;
  limit?: number;
  offset?: number;
  eventName?: string;
}): Promise<{ events: RawEvent[]; total: number }> => {
  const response = await api.get('/analytics/events', { params });
  // The backend might return { message, data: { events, total } } or just { events, total }
  // Based on backend/src/controllers/analytics.controller.ts, it returns { message, data: result }
  return response.data.data || response.data;
};

