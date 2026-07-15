import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getIntegration,
  updateIntegration,
  regenerateKey,
  disableIntegration,
  enableIntegration,
  deleteIntegration,
  type SdkIntegration,
  type SdkEnvironment
} from '@/lib/sdk-integrations/api';
import EngagementPage from './EngagementPage';
import EventTrackingPage from './EventTrackingPage';
import {
  Activity,
  Check,
  Code,
  Copy,
  RefreshCw,
  Settings,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';
import { useConfirm } from '@/context/ConfirmationContext';

const SdkIntegrationDetailPage: React.FC = () => {
  const { integrationId, tab } = useParams<{ integrationId: string; tab?: string }>();
  const navigate = useNavigate();
  const confirm = useConfirm();

  const [integration, setIntegration] = useState<SdkIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editEnvironment, setEditEnvironment] = useState<SdkEnvironment>('development');
  const [editAllowedOrigins, setEditAllowedOrigins] = useState<string>('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const activeTab = tab || 'overview';

  const loadData = async () => {
    if (!integrationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getIntegration(integrationId);
      setIntegration(data);
      // Initialize edit fields
      setEditName(data.name);
      setEditDomain(data.domain);
      setEditEnvironment(data.environment);
      setEditAllowedOrigins(data.allowedOrigins.join(', '));
      setEditDescription(data.description || '');
    } catch (err) {
      console.error('Failed to load integration details', err);
      setError('Failed to load integration details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [integrationId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    if (!integrationId) return;
    const isConfirmed = await confirm({
      title: 'Regenerate SDK Key',
      message: 'Are you sure you want to regenerate the SDK Key? Any existing applications using the old key will lose access immediately.',
      confirmText: 'Regenerate',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      const res = await regenerateKey(integrationId);
      setNewKey(res.sdkKey);
      if (integration) {
        setIntegration({ ...integration, sdkKeyMasked: res.integration.sdkKeyMasked });
      }
    } catch (err) {
      console.error('Failed to regenerate key', err);
      alert('Failed to regenerate SDK key.');
    }
  };

  const handleToggleStatus = async () => {
    if (!integration || !integrationId) return;
    try {
      let updated: SdkIntegration;
      if (integration.status === 'disabled') {
        updated = await enableIntegration(integrationId);
      } else {
        const isConfirmed = await confirm({
          title: 'Disable SDK Integration',
          message: 'Disabling this SDK Integration will block all requests from it. Users will not see guides or surveys. Are you sure?',
          confirmText: 'Disable',
          type: 'danger'
        });
        if (!isConfirmed) return;
        updated = await disableIntegration(integrationId);
      }
      setIntegration(updated);
    } catch (err) {
      console.error('Failed to toggle integration status', err);
      alert('Failed to update integration status.');
    }
  };

  const handleDelete = async () => {
    if (!integrationId) return;
    const isConfirmed = await confirm({
      title: 'Delete SDK Integration',
      message: 'This action is permanent. All guides, surveys, and logs associated with this integration will be permanently deleted. Are you sure?',
      confirmText: 'Delete Permanently',
      type: 'danger'
    });

    if (!isConfirmed) return;

    try {
      await deleteIntegration(integrationId);
      navigate('/sdk-integrations');
    } catch (err) {
      console.error('Failed to delete integration', err);
      alert('Failed to delete SDK integration.');
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!integrationId) return;
    setSaving(true);
    try {
      const origins = editAllowedOrigins
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const updated = await updateIntegration(integrationId, {
        name: editName,
        domain: editDomain,
        environment: editEnvironment,
        allowedOrigins: origins,
        description: editDescription
      });
      setIntegration(updated);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save integration details', err);
      alert('Failed to update SDK integration details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-olive-600" />
      </div>
    );
  }

  if (error || !integration) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-rose-500" />
        <h3 className="mt-4 text-lg font-semibold text-olive-900">Integration Not Found</h3>
        <p className="mt-2 text-sm text-olive-500">{error || 'The requested SDK integration could not be loaded.'}</p>
        <button
          onClick={() => navigate('/sdk-integrations')}
          className="mt-4 rounded-lg bg-olive-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-olive-800 transition-colors"
        >
          Back to List
        </button>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    disabled: 'bg-rose-50 text-rose-700 border-rose-200',
    revoked: 'bg-zinc-50 text-zinc-700 border-zinc-200'
  };

  return (
    <div className="min-h-full bg-olive-50">
      {/* Detail Header */}
      <div className="border-b border-olive-200 bg-white px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="m-0 text-2xl font-bold text-olive-950">{integration.name}</h2>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${statusColors[integration.status]}`}>
                {integration.status}
              </span>
              <span className="rounded bg-olive-100 px-2 py-0.5 text-xs font-semibold text-olive-700 uppercase">
                {integration.environment}
              </span>
            </div>
            <p className="m-0 mt-1 text-sm text-olive-500">
              Target: <span className="font-mono text-olive-700">{integration.domain}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/sdk-integrations')}
              className="rounded-lg border border-olive-200 bg-white px-4 py-2 text-sm font-semibold text-olive-700 shadow-sm hover:bg-olive-50 transition-colors"
            >
              Back to Integrations
            </button>
          </div>
        </div>

        {/* Local Tab Navigation */}
        <div className="mt-6 flex gap-2 border-b border-olive-100">
          <button
            onClick={() => navigate(`/sdk-integrations/${integrationId}/overview`)}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-colors ${
              activeTab === 'overview'
                ? 'border-olive-900 text-olive-900'
                : 'border-transparent text-olive-500 hover:text-olive-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => navigate(`/sdk-integrations/${integrationId}/guides`)}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-colors ${
              activeTab === 'guides'
                ? 'border-olive-900 text-olive-900'
                : 'border-transparent text-olive-500 hover:text-olive-700'
            }`}
          >
            Guides
          </button>
          <button
            onClick={() => navigate(`/sdk-integrations/${integrationId}/surveys`)}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-colors ${
              activeTab === 'surveys'
                ? 'border-olive-900 text-olive-900'
                : 'border-transparent text-olive-500 hover:text-olive-700'
            }`}
          >
            Surveys
          </button>
          <button
            onClick={() => navigate(`/sdk-integrations/${integrationId}/events`)}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-colors ${
              activeTab === 'events'
                ? 'border-olive-900 text-olive-900'
                : 'border-transparent text-olive-500 hover:text-olive-700'
            }`}
          >
            Events
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Config & Keys */}
            <div className="lg:col-span-2 space-y-8">
              {/* SDK Key Panel */}
              <div className="rounded-xl border border-olive-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="h-5 w-5 text-olive-600" />
                  <h3 className="m-0 text-lg font-bold text-olive-900">Integration SDK Key</h3>
                </div>

                {newKey ? (
                  <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      Copy your new SDK Key
                    </div>
                    <p className="text-xs text-amber-700 mb-3">
                      This key will only be shown once. Copy it now and store it securely.
                    </p>
                    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white p-2.5">
                      <code className="flex-1 font-mono text-xs text-olive-800 break-all select-all">{newKey}</code>
                      <button
                        onClick={() => handleCopy(newKey)}
                        className="rounded p-1 text-olive-600 hover:bg-olive-50 transition-colors"
                        title="Copy Key"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 flex items-center gap-2 rounded-lg border border-olive-200 bg-olive-50 p-2.5">
                    <code className="flex-1 font-mono text-xs text-olive-600 break-all select-none">{integration.sdkKeyMasked}</code>
                    <button
                      onClick={() => handleCopy(integration.sdkKeyMasked)}
                      disabled={true}
                      className="rounded p-1 text-olive-400 cursor-not-allowed opacity-50"
                      title="Masked Key cannot be copied"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleRegenerateKey}
                    className="rounded-lg bg-olive-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-olive-800 transition-colors"
                  >
                    Regenerate Key
                  </button>
                  {newKey && (
                    <button
                      onClick={() => setNewKey(null)}
                      className="rounded-lg border border-olive-200 bg-white px-4 py-2 text-sm font-semibold text-olive-700 shadow-sm hover:bg-olive-50 transition-colors"
                    >
                      Done Viewing
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Details Form */}
              <div className="rounded-xl border border-olive-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-olive-600" />
                    <h3 className="m-0 text-lg font-bold text-olive-900">Configuration Details</h3>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-sm font-semibold text-olive-600 hover:text-olive-800 transition-colors"
                    >
                      Edit Configuration
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <form onSubmit={handleSaveChanges} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-olive-600 mb-1">
                        Integration Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-olive-200 px-3.5 py-2 text-sm text-olive-900 focus:border-olive-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-olive-600 mb-1">
                          Primary Domain
                        </label>
                        <input
                          type="text"
                          required
                          value={editDomain}
                          onChange={(e) => setEditDomain(e.target.value)}
                          placeholder="example.com"
                          className="w-full rounded-lg border border-olive-200 px-3.5 py-2 text-sm text-olive-900 focus:border-olive-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-olive-600 mb-1">
                          Environment
                        </label>
                        <select
                          value={editEnvironment}
                          onChange={(e) => setEditEnvironment(e.target.value as SdkEnvironment)}
                          className="w-full rounded-lg border border-olive-200 bg-white px-3.5 py-2 text-sm text-olive-900 focus:border-olive-500 focus:outline-none"
                        >
                          <option value="development">Development</option>
                          <option value="staging">Staging</option>
                          <option value="production">Production</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-olive-600 mb-1">
                        Allowed CORS Origins (comma-separated URLs)
                      </label>
                      <input
                        type="text"
                        value={editAllowedOrigins}
                        onChange={(e) => setEditAllowedOrigins(e.target.value)}
                        placeholder="http://localhost:3000, https://staging.example.com"
                        className="w-full rounded-lg border border-olive-200 px-3.5 py-2 text-sm text-olive-900 focus:border-olive-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-olive-600 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-olive-200 px-3.5 py-2 text-sm text-olive-900 focus:border-olive-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-olive-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-olive-800 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          loadData();
                        }}
                        className="rounded-lg border border-olive-200 bg-white px-4 py-2 text-sm font-semibold text-olive-700 shadow-sm hover:bg-olive-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-olive-400">Primary Domain</span>
                        <span className="text-sm font-semibold text-olive-800">{integration.domain}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold uppercase tracking-wider text-olive-400">Environment</span>
                        <span className="text-sm font-semibold text-olive-800 capitalize">{integration.environment}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-olive-400">Allowed Origins</span>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {integration.allowedOrigins.length > 0 ? (
                          integration.allowedOrigins.map((origin) => (
                            <span key={origin} className="rounded bg-olive-100 border border-olive-200 px-2 py-0.5 text-xs text-olive-700 font-mono">
                              {origin}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm italic text-olive-400">Only matching primary domain requests allowed</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-bold uppercase tracking-wider text-olive-400">Description</span>
                      <p className="mt-1 text-sm text-olive-700 whitespace-pre-wrap">{integration.description || 'No description provided.'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Connection Diagnostics & Control */}
            <div className="space-y-8">
              {/* Health Diagnostics Panel */}
              <div className="rounded-xl border border-olive-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-olive-600" />
                  <h3 className="m-0 text-lg font-bold text-olive-900">Diagnostics &amp; Health</h3>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between border-b border-olive-50 pb-2">
                    <span className="text-xs text-olive-500">Connections (All-time)</span>
                    <span className="text-sm font-bold text-olive-800">{integration.connectionCount}</span>
                  </div>
                  <div className="flex justify-between border-b border-olive-50 pb-2">
                    <span className="text-xs text-olive-500">SDK Client Version</span>
                    <span className="text-sm font-semibold text-olive-700">{integration.sdkVersion || 'Not connected yet'}</span>
                  </div>
                  <div className="flex justify-between border-b border-olive-50 pb-2">
                    <span className="text-xs text-olive-500">Latest Active Origin</span>
                    <span className="text-sm font-mono text-xs text-olive-700 truncate max-w-[150px]">{integration.latestOrigin || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-olive-50 pb-2">
                    <span className="text-xs text-olive-500">First Registered</span>
                    <span className="text-xs font-semibold text-olive-700">
                      {integration.firstConnectedAt ? new Date(integration.firstConnectedAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-olive-50 pb-2">
                    <span className="text-xs text-olive-500">Last Live Connect</span>
                    <span className="text-xs font-semibold text-olive-700">
                      {integration.lastConnectedAt ? new Date(integration.lastConnectedAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-olive-50 pb-2">
                    <span className="text-xs text-olive-500">Last Heartbeat</span>
                    <span className="text-xs font-semibold text-olive-700">
                      {integration.lastHeartbeatAt ? new Date(integration.lastHeartbeatAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-olive-50 pb-2">
                    <span className="text-xs text-olive-500">Last Setup Fetch</span>
                    <span className="text-xs font-semibold text-olive-700">
                      {integration.lastRuntimeRequestAt ? new Date(integration.lastRuntimeRequestAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-olive-500">Last Logged Event</span>
                    <span className="text-xs font-semibold text-olive-700">
                      {integration.lastEventRequestAt ? new Date(integration.lastEventRequestAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  <h3 className="m-0 text-lg font-bold text-rose-900">Danger Zone</h3>
                </div>

                <p className="text-xs text-rose-700 mb-4">
                  Temporarily disable administrative operations or permanently delete this entire integration context.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleToggleStatus}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-semibold shadow transition-colors flex items-center justify-center gap-2 ${
                      integration.status === 'disabled'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                        : 'bg-amber-600 text-white hover:bg-amber-500'
                    }`}
                  >
                    {integration.status === 'disabled' ? (
                      <>
                        <Play className="h-4 w-4" />
                        Enable Integration
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4" />
                        Disable Integration
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDelete}
                    className="w-full rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Integration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'guides' && (
          <div className="rounded-xl border border-olive-200 bg-white shadow-sm overflow-hidden">
            <EngagementPage sdkIntegrationId={integrationId} defaultTab="guides" hideHeader={true} />
          </div>
        )}

        {activeTab === 'surveys' && (
          <div className="rounded-xl border border-olive-200 bg-white shadow-sm overflow-hidden">
            <EngagementPage sdkIntegrationId={integrationId} defaultTab="surveys" hideHeader={true} />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="rounded-xl border border-olive-200 bg-white shadow-sm overflow-hidden">
            <EventTrackingPage sdkIntegrationId={integrationId} hideHeader={true} onOpenDocs={() => navigate('/sdk-docs')} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SdkIntegrationDetailPage;
