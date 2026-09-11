import React, { useState, useEffect } from 'react';
import {
  Bot,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Cpu,
  RefreshCw,
  Search,
  Terminal,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp,
  Smartphone,
} from 'lucide-react';
import SectionCard from '@/components/SectionCard';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { useWorkspace } from '@/features/workspaces';
import { API_BASE_URL } from '@/services/api';
import { getMcpTools, type McpToolManifestEntry } from '@/services/mcp';
import type { CompanionDevice } from '../hooks/useSettings';

interface McpIntegrationSettingsProps {
  companionDevices?: CompanionDevice[];
  isLoadingCompanionDevices?: boolean;
  onRevokeCompanionDevice?: (id: string) => void;
  onNavigateToProfile?: () => void;
  onOpenCompanionModal?: () => void;
}

export const McpIntegrationSettings: React.FC<McpIntegrationSettingsProps> = ({
  companionDevices = [],
  isLoadingCompanionDevices = false,
  onRevokeCompanionDevice,
  onNavigateToProfile,
  onOpenCompanionModal,
}) => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { showToast } = useToast();

  const userRole = activeWorkspace?.role ?? 'MEMBER';

  const [tools, setTools] = useState<McpToolManifestEntry[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState<boolean>(true);
  const [toolsError, setToolsError] = useState<string | null>(null);

  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeClientTab, setActiveClientTab] = useState<'claude' | 'cursor' | 'curl'>('claude');

  const [showSyncKey, setShowSyncKey] = useState<boolean>(false);
  const [expandedTool, setExpandedTool] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedConfig, setCopiedConfig] = useState<boolean>(false);

  const mcpServerUrl = `${API_BASE_URL}/mcp`;

  const fetchTools = async () => {
    try {
      setIsLoadingTools(true);
      setToolsError(null);
      const manifest = await getMcpTools();
      setTools(manifest);
    } catch (err: unknown) {
      console.error('Failed to load MCP tool manifest', err);
      setToolsError('Could not connect to backend MCP tool registry.');
    } finally {
      setIsLoadingTools(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, []);

  const handleCopyKey = () => {
    if (!user?.syncApiKey) return;
    navigator.clipboard.writeText(user.syncApiKey);
    setCopiedKey(true);
    showToast({ variant: 'success', message: 'Sync API Key copied to clipboard' });
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const getClaudeConfig = () => {
    return JSON.stringify(
      {
        mcpServers: {
          todosync: {
            url: mcpServerUrl,
            headers: {
              'x-sync-key': user?.syncApiKey || 'YOUR_SYNC_API_KEY',
            },
          },
        },
      },
      null,
      2
    );
  };

  const getCursorConfig = () => {
    return `// In Cursor Settings -> Features -> MCP Servers\nName: TodoSync\nType: sse\nURL: ${mcpServerUrl}\nHeaders: {\n  "x-sync-key": "${user?.syncApiKey || 'YOUR_SYNC_API_KEY'}"\n}`;
  };

  const getCurlConfig = () => {
    return `# List tools\ncurl -X GET "${mcpServerUrl}/tools" \\\n  -H "x-sync-key: ${user?.syncApiKey || 'YOUR_SYNC_API_KEY'}"\n\n# Invoke tool\ncurl -X POST "${mcpServerUrl}/tools/task:search" \\\n  -H "x-sync-key: ${user?.syncApiKey || 'YOUR_SYNC_API_KEY'}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"limit": 10}'`;
  };

  const handleCopyConfig = () => {
    const text =
      activeClientTab === 'claude'
        ? getClaudeConfig()
        : activeClientTab === 'cursor'
        ? getCursorConfig()
        : getCurlConfig();
    navigator.clipboard.writeText(text);
    setCopiedConfig(true);
    showToast({ variant: 'success', message: 'Configuration snippet copied to clipboard' });
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  // Scope definitions with backend alignment
  const allScopes = [
    {
      scope: 'work:read',
      label: 'Work Read',
      description: 'Fetch tasks, projects, epics, and activity history.',
      isGranted: true,
    },
    {
      scope: 'work:write',
      label: 'Work Write',
      description: 'Create, update, assign, or delete tasks, projects, and epics.',
      isGranted: true,
    },
    {
      scope: 'collaboration:read',
      label: 'Collaboration Read',
      description: 'Read notes, task comments, and chat messages.',
      isGranted: true,
    },
    {
      scope: 'collaboration:write',
      label: 'Collaboration Write',
      description: 'Add comments, create notes, and extract tasks from chat.',
      isGranted: true,
    },
    {
      scope: 'analytics:read',
      label: 'Analytics Read',
      description: 'Access operational metrics, SLA analytics, and forecasts.',
      isGranted: true,
    },
    {
      scope: 'ai:execute',
      label: 'AI Execution',
      description: 'Run daily planning, task decomposition, and note generation.',
      isGranted: true,
    },
    {
      scope: 'prompt:read',
      label: 'Prompt Read',
      description: 'List and view Prompt Library templates and versions.',
      isGranted: true,
    },
    {
      scope: 'prompt:write',
      label: 'Prompt Write',
      description: 'Test prompts in playground and execute variable rendering.',
      isGranted: true,
    },
    {
      scope: 'workspace:admin',
      label: 'Workspace Admin',
      description: 'Manage workspace details and list workspace members.',
      isGranted: userRole === 'OWNER' || userRole === 'ADMIN',
    },
  ];

  // Tool filtering & domain breakdown
  const domains = ['all', ...Array.from(new Set(tools.map((t) => t.domain)))];

  const filteredTools = tools.filter((t) => {
    const matchesDomain = selectedDomain === 'all' || t.domain === selectedDomain;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'read':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            Read
          </span>
        );
      case 'write':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            Write
          </span>
        );
      case 'sensitive_write':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 border border-orange-200">
            Sensitive Write
          </span>
        );
      case 'destructive':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
            Destructive
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {risk}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* MCP Overview Banner */}
      <div className="relative overflow-hidden rounded border border-olive-800 bg-gradient-to-r from-olive-950 via-olive-900 to-slate-900 p-5 text-white shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                MCP Server Active
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-olive-500/20 text-olive-200 border border-olive-500/30">
                <Cpu className="w-3 h-3" /> {tools.length} Tools Manifested
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <ShieldCheck className="w-3 h-3" /> 2-Phase Risk Policy
              </span>
            </div>

            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" /> Model Context Protocol (MCP) Integration
            </h3>

            <p className="text-xs text-olive-300 leading-relaxed">
              Expose TodoSync&apos;s 74+ domain capabilities (Tasks, Projects, SLA, Priority, Analytics, Intelligence) to external AI clients like Claude Desktop, Cursor, and custom autonomous agents.
            </p>
          </div>

          {onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition border border-white/20 cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              Manage Sync Key
            </button>
          )}
        </div>
      </div>

      {/* Setup & Connection Management Card */}
      <SectionCard>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-sm font-bold text-olive-950 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-olive-700" /> MCP Server Connection & Setup
            </h3>
            <p className="text-xs text-olive-600 mt-0.5">
              Configure supported AI clients to communicate with your TodoSync workspace backend.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-olive-100/60 p-1 rounded border border-olive-200">
            <button
              type="button"
              onClick={() => setActiveClientTab('claude')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activeClientTab === 'claude'
                  ? 'bg-white text-olive-950 font-bold shadow-xs'
                  : 'text-olive-700 hover:text-olive-950'
              }`}
            >
              Claude Desktop
            </button>
            <button
              type="button"
              onClick={() => setActiveClientTab('cursor')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activeClientTab === 'cursor'
                  ? 'bg-white text-olive-950 font-bold shadow-xs'
                  : 'text-olive-700 hover:text-olive-950'
              }`}
            >
              Cursor / VS Code
            </button>
            <button
              type="button"
              onClick={() => setActiveClientTab('curl')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                activeClientTab === 'curl'
                  ? 'bg-white text-olive-950 font-bold shadow-xs'
                  : 'text-olive-700 hover:text-olive-950'
              }`}
            >
              cURL / HTTP
            </button>
          </div>
        </div>

        {/* Sync API Key Bar */}
        <div className="mb-4 p-3 rounded border border-olive-200 bg-olive-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-olive-950">Your Sync API Key</span>
              <span className="text-[10px] text-olive-500 font-mono">Header: x-sync-key</span>
            </div>
            <p className="text-[11px] text-olive-600">
              Used by MCP clients to authenticate calls. Keep private.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <code className="px-2.5 py-1 rounded bg-white border border-olive-300 font-mono text-[11px] text-olive-900">
              {showSyncKey
                ? user?.syncApiKey || 'No Key Generated'
                : user?.syncApiKey
                ? `${user.syncApiKey.slice(0, 8)}...${user.syncApiKey.slice(-4)}`
                : '••••••••••••••••'}
            </code>
            <button
              type="button"
              onClick={() => setShowSyncKey(!showSyncKey)}
              className="px-2 py-1 rounded border border-olive-300 bg-white hover:bg-olive-100 text-olive-700 text-[11px] font-medium transition"
            >
              {showSyncKey ? 'Hide' : 'Show'}
            </button>
            <button
              type="button"
              onClick={handleCopyKey}
              disabled={!user?.syncApiKey}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-olive-800 hover:bg-olive-900 text-white text-[11px] font-medium transition cursor-pointer"
            >
              {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedKey ? 'Copied' : 'Copy Key'}
            </button>
          </div>
        </div>

        {/* Client Config Code Snippet */}
        <div className="relative rounded border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
            <span>
              {activeClientTab === 'claude'
                ? 'claude_desktop_config.json'
                : activeClientTab === 'cursor'
                ? 'Cursor Features -> MCP Settings'
                : 'cURL Example'}
            </span>
            <button
              type="button"
              onClick={handleCopyConfig}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition"
            >
              {copiedConfig ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedConfig ? 'Copied' : 'Copy Snippet'}
            </button>
          </div>
          <pre className="whitespace-pre text-[11px] leading-relaxed text-emerald-300">
            {activeClientTab === 'claude'
              ? getClaudeConfig()
              : activeClientTab === 'cursor'
              ? getCursorConfig()
              : getCurlConfig()}
          </pre>
        </div>
      </SectionCard>

      {/* Authorized Permissions & Scopes Summary */}
      <SectionCard>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-sm font-bold text-olive-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Authorized Scopes & Security Policy
            </h3>
            <p className="text-xs text-olive-600 mt-0.5">
              Scopes automatically enforced by backend policy based on your authenticated role ({userRole}).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {allScopes.map((item) => (
            <div
              key={item.scope}
              className={`p-3 rounded border flex flex-col justify-between space-y-2 ${
                item.isGranted
                  ? 'border-olive-200 bg-olive-50/40'
                  : 'border-slate-200 bg-slate-50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-bold text-olive-950">{item.label}</span>
                  {item.isGranted ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      Granted
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600">
                      Restricted
                    </span>
                  )}
                </div>
                <code className="text-[10px] font-mono text-olive-600 block mb-1">{item.scope}</code>
                <p className="text-[11px] text-olive-700 leading-snug">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Connected Companion Devices / Active Client Keys */}
      <SectionCard>
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <h3 className="text-sm font-bold text-olive-950 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-olive-700" /> Connected MCP Client Devices
            </h3>
            <p className="text-xs text-olive-600 mt-0.5">
              Manage paired companion devices and external keys with access to your workspace.
            </p>
          </div>

          {onOpenCompanionModal && (
            <button
              type="button"
              onClick={onOpenCompanionModal}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-olive-800 hover:bg-olive-900 text-white text-xs font-medium transition cursor-pointer"
            >
              + Pair Companion Client
            </button>
          )}
        </div>

        {isLoadingCompanionDevices ? (
          <div className="p-6 text-center text-xs text-olive-500">Loading client devices...</div>
        ) : companionDevices.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-olive-300 rounded bg-olive-50/30 space-y-2">
            <p className="text-xs text-olive-600 font-medium">No companion client devices paired yet.</p>
            <p className="text-[11px] text-olive-500">
              Use your Sync API Key directly in Claude Desktop or pair a companion device for isolated access.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-olive-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-olive-100/60 text-olive-900 font-bold border-b border-olive-200">
                <tr>
                  <th className="p-2.5">Device / Client Name</th>
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Paired Date</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-200 text-olive-800">
                {companionDevices.map((dev) => (
                  <tr key={dev.id} className="hover:bg-olive-50/50">
                    <td className="p-2.5 font-bold text-olive-950">{dev.deviceName}</td>
                    <td className="p-2.5 capitalize">{dev.deviceType}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          dev.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dev.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {dev.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-[11px] text-olive-600">
                      {dev.createdAt ? new Date(dev.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-2.5 text-right">
                      {dev.status !== 'revoked' && onRevokeCompanionDevice && (
                        <button
                          type="button"
                          onClick={() => onRevokeCompanionDevice(dev.id)}
                          className="px-2 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-medium transition"
                        >
                          Revoke Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Dynamic 74-Tool Manifest Browser */}
      <SectionCard>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-olive-950 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-olive-700" /> Backend MCP Capability Browser ({filteredTools.length} / {tools.length})
            </h3>
            <p className="text-xs text-olive-600 mt-0.5">
              Live manifest derived dynamically from backend server endpoints (<code className="font-mono text-[10px]">GET /api/mcp/tools</code>).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-olive-500" />
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-64 pl-8 pr-3 py-1.5 rounded border border-olive-300 bg-white text-xs text-olive-900 focus:border-olive-600 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={fetchTools}
              disabled={isLoadingTools}
              className="p-1.5 rounded border border-olive-300 bg-white hover:bg-olive-100 text-olive-700 transition"
              title="Refresh tools manifest"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingTools ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Domain Filter Tabs */}
        <div className="flex flex-wrap gap-1 mb-4 pb-3 border-b border-olive-200 text-xs">
          {domains.map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => setSelectedDomain(dom)}
              className={`px-2.5 py-1 rounded text-xs capitalize transition cursor-pointer ${
                selectedDomain === dom
                  ? 'bg-olive-800 text-white font-bold shadow-xs'
                  : 'text-olive-700 hover:bg-olive-100/70 hover:text-olive-950 font-medium'
              }`}
            >
              {dom === 'all' ? `All (${tools.length})` : dom}
            </button>
          ))}
        </div>

        {/* Tool Grid */}
        {isLoadingTools ? (
          <div className="p-8 text-center text-xs text-olive-500">Loading backend MCP tools manifest...</div>
        ) : toolsError ? (
          <div className="p-6 text-center text-xs text-red-600 bg-red-50 border border-red-200 rounded">
            {toolsError}
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="p-6 text-center text-xs text-olive-500 border border-dashed border-olive-200 rounded">
            No tools match the selected domain or query filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTools.map((tool) => {
              const isExpanded = expandedTool === tool.name;
              return (
                <div
                  key={tool.name}
                  className="p-3.5 rounded border border-olive-200 bg-white hover:border-olive-300 transition space-y-2"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="font-mono font-bold text-xs text-olive-950 bg-olive-100/70 px-2 py-0.5 rounded border border-olive-200">
                        {tool.name}
                      </code>
                      {getRiskBadge(tool.risk)}
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                        scope: {tool.requiredScope}
                      </span>
                      {tool.requiresConfirmation && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 2-Phase Confirm
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                      className="text-xs text-olive-700 hover:text-olive-950 font-medium flex items-center gap-1 cursor-pointer self-start md:self-auto"
                    >
                      {isExpanded ? 'Hide Schema' : 'View Input Schema'}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-xs text-olive-700 leading-relaxed">{tool.description}</p>

                  {/* Input Schema Preview */}
                  {isExpanded && tool.inputSchema && (
                    <div className="mt-2 pt-2 border-t border-olive-100 bg-slate-950 rounded p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                      <pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default McpIntegrationSettings;
