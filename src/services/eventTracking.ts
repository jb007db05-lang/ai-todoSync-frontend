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
  payload: any;
  createdAt: string;
}

export interface IdentifiedUser {
  _id: string;
  apiKeyId: string;
  userIdentifier: string;
  metadata: any;
  createdAt: string;
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

export const getTrackedEvents = async (apiKeyId: string, filters: any = {}): Promise<TrackedEvent[]> => {
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
