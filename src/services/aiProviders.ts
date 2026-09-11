import api from "./api";

export interface LlmProviderItem {
  providerId: string;
  displayName: string;
  isEnabled: boolean;
  baseUrl?: string;
  supportedCapabilities: string[];
  supportedParameters: string[];
  sortOrder: number;
}

export interface LlmModelItem {
  modelId: string;
  providerId: string;
  displayName: string;
  isEnabled: boolean;
  isDefault: boolean;
  contextWindow: number;
  maxOutputTokens: number;
  inputPricePerMToken: number;
  outputPricePerMToken: number;
  cachedInputPricePerMToken: number;
  capabilities: string[];
  supportedParameters: string[];
}

export const getLlmProviders = async (): Promise<LlmProviderItem[]> => {
  const res = await api.get<{ message: string; data: { providers: LlmProviderItem[] } }>("/ai/providers");
  return res.data.data?.providers || [];
};

export const getLlmModels = async (providerId?: string): Promise<LlmModelItem[]> => {
  const params = providerId ? { provider: providerId } : {};
  const res = await api.get<{ message: string; data: { models: LlmModelItem[] } }>("/ai/models", { params });
  return res.data.data?.models || [];
};

export const getLlmModelDetails = async (modelId: string): Promise<LlmModelItem | null> => {
  const res = await api.get<{ message: string; data: { model: LlmModelItem } }>(`/ai/models/${modelId}`);
  return res.data.data?.model || null;
};
