import api from './api';

export interface McpToolManifestEntry {
  name: string;
  description: string;
  domain: string;
  risk: 'read' | 'write' | 'sensitive_write' | 'destructive' | 'security_critical';
  requiredScope: string;
  requiresConfirmation?: boolean;
  inputSchema?: {
    type?: string;
    required?: string[];
    properties?: Record<string, { type?: string; description?: string; enum?: string[]; items?: unknown }>;
    additionalProperties?: boolean;
  };
}

export interface McpPromptArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface McpPromptEntry {
  name: string;
  description: string;
  arguments?: McpPromptArgument[];
  template: string;
}

export const getMcpTools = async (): Promise<McpToolManifestEntry[]> => {
  const res = await api.get<{ tools: McpToolManifestEntry[] }>('/mcp/tools');
  return res.data.tools || [];
};

export const getMcpPrompts = async (): Promise<McpPromptEntry[]> => {
  const res = await api.get<{ prompts: McpPromptEntry[] }>('/mcp/prompts');
  return res.data.prompts || [];
};
