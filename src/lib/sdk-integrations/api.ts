import api from '@/services/api';

export type SdkIntegrationStatus = 'pending' | 'connected' | 'disabled' | 'revoked';
export type SdkEnvironment = 'development' | 'staging' | 'production';

export interface SdkIntegration {
  id: string;
  name: string;
  environment: SdkEnvironment;
  domain: string;
  allowedOrigins: string[];
  description?: string;
  status: SdkIntegrationStatus;
  sdkKeyMasked: string;
  sdkVersion?: string | null;
  firstConnectedAt?: string | null;
  lastConnectedAt?: string | null;
  lastRuntimeRequestAt?: string | null;
  lastEventRequestAt?: string | null;
  lastHeartbeatAt?: string | null;
  connectionCount: number;
  latestOrigin?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApiEnvelope<T> { data: T }
interface IntegrationResponse { integration: SdkIntegration }
interface CreateResponse { integration: SdkIntegration; sdkKey: string }

export const listIntegrations = async (): Promise<SdkIntegration[]> => {
  const res = await api.get<ApiEnvelope<{ integrations: SdkIntegration[] }>>('/sdk-integrations');
  return res.data.data.integrations;
};

export const getIntegration = async (id: string): Promise<SdkIntegration> => {
  const res = await api.get<ApiEnvelope<IntegrationResponse>>(`/sdk-integrations/${id}`);
  return res.data.data.integration;
};

export const createIntegration = async (payload: {
  name: string;
  environment: SdkEnvironment;
  domain: string;
  allowedOrigins?: string[];
  description?: string;
}): Promise<CreateResponse> => {
  const res = await api.post<ApiEnvelope<CreateResponse>>('/sdk-integrations', payload);
  return res.data.data;
};

export const updateIntegration = async (
  id: string,
  payload: {
    name?: string;
    environment?: string;
    domain?: string;
    allowedOrigins?: string[];
    description?: string;
  }
): Promise<SdkIntegration> => {
  const res = await api.patch<ApiEnvelope<IntegrationResponse>>(`/sdk-integrations/${id}`, payload);
  return res.data.data.integration;
};

export const regenerateKey = async (id: string): Promise<CreateResponse> => {
  const res = await api.post<ApiEnvelope<CreateResponse>>(`/sdk-integrations/${id}/regenerate-key`);
  return res.data.data;
};

export const disableIntegration = async (id: string): Promise<SdkIntegration> => {
  const res = await api.post<ApiEnvelope<IntegrationResponse>>(`/sdk-integrations/${id}/disable`);
  return res.data.data.integration;
};

export const enableIntegration = async (id: string): Promise<SdkIntegration> => {
  const res = await api.post<ApiEnvelope<IntegrationResponse>>(`/sdk-integrations/${id}/enable`);
  return res.data.data.integration;
};

export const deleteIntegration = async (id: string): Promise<void> => {
  await api.delete(`/sdk-integrations/${id}`);
};
