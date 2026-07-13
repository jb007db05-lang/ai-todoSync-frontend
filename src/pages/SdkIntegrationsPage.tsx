import { useEffect, useState } from 'react';
import {
  AlertCircle, CheckCircle2, Clock, Copy, EyeOff, Globe,
  KeyRound, Loader2, Plus, RefreshCw, Server,
  Shield, Trash2, WifiOff, Zap, ChevronDown, ChevronRight, Code2
} from 'lucide-react';
import type { SdkIntegration, SdkEnvironment } from '@/lib/sdk-integrations/api';
import {
  listIntegrations, createIntegration, regenerateKey,
  disableIntegration, enableIntegration, deleteIntegration
} from '@/lib/sdk-integrations/api';

// ---------- helpers ----------
const ENV_LABELS: Record<SdkEnvironment, string> = { development: 'Development', staging: 'Staging', production: 'Production' };
const ENV_COLORS: Record<SdkEnvironment, string> = {
  development: 'bg-sky-100 text-sky-700 border-sky-200',
  staging: 'bg-amber-100 text-amber-700 border-amber-200',
  production: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};
const STATUS_META: Record<SdkIntegration['status'], { label: string; icon: JSX.Element; cls: string }> = {
  pending: { label: 'Pending', icon: <Clock size={13} />, cls: 'bg-zinc-100 text-zinc-600 border-zinc-200' },
  connected: { label: 'Connected', icon: <CheckCircle2 size={13} />, cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  disabled: { label: 'Disabled', icon: <WifiOff size={13} />, cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  revoked: { label: 'Revoked', icon: <AlertCircle size={13} />, cls: 'bg-red-100 text-red-700 border-red-200' },
};

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const fmtTime = (d?: string | null) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Never';

function Badge({ children, cls }: { children: React.ReactNode; cls: string }) {
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cls}`}>{children}</span>;
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const copy = () => { void navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); };
  return (
    <button onClick={copy} type="button" className="flex items-center gap-1 text-xs font-semibold text-olive-600 hover:text-olive-800 transition-colors">
      {done ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

// ---------- Create modal ----------
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const [name, setName] = useState('');
  const [env, setEnv] = useState<SdkEnvironment>('production');
  const [domain, setDomain] = useState('');
  const [origins, setOrigins] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || !domain.trim()) { setErr('Name and domain are required.'); return; }
    setLoading(true); setErr(null);
    try {
      const allowedOrigins = origins
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
      const { sdkKey } = await createIntegration({
        name,
        environment: env,
        domain,
        allowedOrigins,
        description: desc,
      });
      onCreated(sdkKey);
    } catch { setErr('Failed to create integration.'); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-zinc-200 overflow-hidden">
        <div className="bg-gradient-to-r from-olive-700 to-olive-600 px-6 py-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Globe size={18} /> New SDK Integration</h2>
          <p className="text-sm text-olive-200 mt-0.5">Connect an external website to the Engagement Platform</p>
        </div>
        <div className="p-6 grid gap-4 overflow-y-auto max-h-[70vh]">
          {err && <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700"><AlertCircle size={15} />{err}</div>}
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Integration Name *</span>
            <input className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-olive-400" placeholder="e.g. Production Website" value={name} onChange={e => setName(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Environment *</span>
            <select className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-olive-400" value={env} onChange={e => setEnv(e.target.value as SdkEnvironment)}>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Application URL *</span>
            <input className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-olive-400" placeholder="https://app.company.com" value={domain} onChange={e => setDomain(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Additional Allowed Origins (optional, comma-separated)</span>
            <input className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-olive-400" placeholder="https://origin2.com, http://localhost:5173" value={origins} onChange={e => setOrigins(e.target.value)} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Description (optional)</span>
            <textarea className="rounded-lg border border-zinc-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-olive-400 resize-none h-20" placeholder="Brief description of this integration" value={desc} onChange={e => setDesc(e.target.value)} />
          </label>
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} type="button" className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50">Cancel</button>
          <button onClick={() => void submit()} type="button" disabled={loading} className="px-5 py-2 rounded-lg bg-olive-700 text-white text-sm font-bold hover:bg-olive-800 disabled:opacity-60 flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />} Create Integration
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Key reveal modal ----------
function KeyRevealModal({ sdkKey, name, onClose }: { sdkKey: string; name: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-zinc-200">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><KeyRound size={18} /> SDK Key Generated</h2>
          <p className="text-sm text-emerald-100 mt-0.5">For <span className="font-bold">{name}</span></p>
        </div>
        <div className="p-6 grid gap-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>This key will not be shown again. Copy it now and store it securely.</span>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Public SDK Key</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setVisible(!visible)} type="button" className="text-zinc-400 hover:text-zinc-600"><EyeOff size={14} /></button>
                <CopyBtn text={sdkKey} />
              </div>
            </div>
            <code className="text-xs font-mono text-olive-800 break-all">{visible ? sdkKey : `${sdkKey.slice(0, 8)}${'•'.repeat(32)}`}</code>
          </div>
        </div>
        <div className="flex justify-end px-6 pb-6">
          <button onClick={onClose} type="button" className="px-5 py-2 rounded-lg bg-olive-700 text-white text-sm font-bold hover:bg-olive-800">Done</button>
        </div>
      </div>
    </div>
  );
}

// ---------- Install guide ----------
function InstallGuide({ integration }: { integration: SdkIntegration }) {
  const [open, setOpen] = useState(false);
  const masked = integration.sdkKeyMasked;
  return (
    <div className="rounded-xl border border-zinc-200 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 bg-zinc-50 hover:bg-zinc-100 transition-colors text-sm font-bold text-zinc-700"
        onClick={() => setOpen(!open)} type="button"
      >
        <span className="flex items-center gap-2"><Code2 size={15} />SDK Installation Guide</span>
        {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      </button>
      {open && (
        <div className="p-5 grid gap-4 border-t border-zinc-200 bg-white">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">1. Install the SDK</p>
            <pre className="bg-zinc-900 text-emerald-300 rounded-lg px-4 py-3 text-xs overflow-auto">{`npm install @engagement/sdk`}</pre>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">2. Initialize</p>
            <pre className="bg-zinc-900 text-emerald-300 rounded-lg px-4 py-3 text-xs overflow-auto">{`import { EngagementSDK } from '@engagement/sdk';

EngagementSDK.init({
  sdkKey: '${masked}',
  // DO NOT send tenantId — resolved automatically
});`}</pre>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">3. Identify user (optional)</p>
            <pre className="bg-zinc-900 text-emerald-300 rounded-lg px-4 py-3 text-xs overflow-auto">{`EngagementSDK.identify({ userId: 'user-123', role: 'admin', plan: 'pro' });`}</pre>
          </div>
          <div className="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-xs text-sky-700">
            <strong>Domain:</strong> {integration.domain} &nbsp;·&nbsp; <strong>Environment:</strong> {integration.environment}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Integration detail card ----------
function IntegrationCard({
  integration, onRefresh
}: {
  integration: SdkIntegration;
  onRefresh: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const act = async (fn: () => Promise<unknown>) => { setBusy(true); try { await fn(); await onRefresh(); } finally { setBusy(false); } };

  const sm = STATUS_META[integration.status];

  return (
    <>
      {newKey && <KeyRevealModal sdkKey={newKey} name={integration.name} onClose={() => setNewKey(null)} />}
      <div className={`rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md overflow-hidden ${integration.status === 'disabled' || integration.status === 'revoked' ? 'opacity-70' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-zinc-900 truncate">{integration.name}</h3>
              <Badge cls={sm.cls}>{sm.icon}{sm.label}</Badge>
              <Badge cls={ENV_COLORS[integration.environment]}>{ENV_LABELS[integration.environment]}</Badge>
            </div>
            <p className="text-sm text-zinc-500 flex items-center gap-1.5"><Globe size={13} />{integration.domain}</p>
            {integration.description && <p className="text-xs text-zinc-400 mt-1">{integration.description}</p>}
          </div>
          <button onClick={() => setExpanded(!expanded)} type="button" className="shrink-0 text-zinc-400 hover:text-zinc-700 transition-colors">
            {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 divide-x divide-zinc-100 border-t border-zinc-100 bg-zinc-50/60">
          {[
            { label: 'Connections', value: integration.connectionCount },
            { label: 'Last Active', value: integration.lastConnectedAt ? fmtDate(integration.lastConnectedAt) : 'Never' },
            { label: 'SDK Version', value: integration.sdkVersion ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
              <p className="text-sm font-bold text-zinc-700 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {/* SDK key row */}
        <div className="flex items-center gap-3 px-6 py-3 border-t border-zinc-100 bg-zinc-50">
          <KeyRound size={13} className="text-zinc-400 shrink-0" />
          <code className="text-xs font-mono text-zinc-600 flex-1 truncate">{integration.sdkKeyMasked}</code>
          <CopyBtn text={integration.sdkKeyMasked} />
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-6 pb-5 pt-4 border-t border-zinc-100 grid gap-5">
            {/* Connection info */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'First Connected', value: fmtTime(integration.firstConnectedAt) },
                { label: 'Last Runtime', value: fmtTime(integration.lastRuntimeRequestAt) },
                { label: 'Last Event', value: fmtTime(integration.lastEventRequestAt) },
                { label: 'Last Heartbeat', value: fmtTime(integration.lastHeartbeatAt) },
                { label: 'Created', value: fmtDate(integration.createdAt) },
                { label: 'Latest Origin', value: integration.latestOrigin ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{label}</p>
                  <p className="text-xs font-semibold text-zinc-700 mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>

            {integration.allowedOrigins?.length > 0 && (
              <div className="rounded-lg bg-zinc-50 border border-zinc-100 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Additional Allowed Origins</p>
                <p className="text-xs font-semibold text-zinc-700 mt-0.5 break-all">
                  {integration.allowedOrigins.join(', ')}
                </p>
              </div>
            )}

            <InstallGuide integration={integration} />

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => act(async () => { const { sdkKey } = await regenerateKey(integration.id); setNewKey(sdkKey); })}
                disabled={busy} type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={12} />Regenerate Key
              </button>
              {integration.status === 'disabled' ? (
                <button onClick={() => act(() => enableIntegration(integration.id))} disabled={busy} type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 transition-colors">
                  <Zap size={12} />Enable
                </button>
              ) : (
                <button onClick={() => act(() => disableIntegration(integration.id))} disabled={busy || integration.status === 'revoked'} type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition-colors">
                  <WifiOff size={12} />Disable
                </button>
              )}
              <button
                onClick={() => { if (window.confirm(`Delete "${integration.name}"? This cannot be undone.`)) void act(() => deleteIntegration(integration.id)); }}
                disabled={busy} type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors ml-auto"
              >
                <Trash2 size={12} />Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Main page ----------
export default function SdkIntegrationsPage() {
  const [integrations, setIntegrations] = useState<SdkIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<{ key: string; name: string } | null>(null);
  const [search, setSearch] = useState('');
  const [filterEnv, setFilterEnv] = useState<SdkEnvironment | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<SdkIntegration['status'] | 'all'>('all');

  const load = async () => {
    setLoading(true);
    try { setIntegrations(await listIntegrations()); } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const filtered = integrations.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.domain.toLowerCase().includes(search.toLowerCase());
    const matchEnv = filterEnv === 'all' || i.environment === filterEnv;
    const matchStatus = filterStatus === 'all' || i.status === filterStatus;
    return matchSearch && matchEnv && matchStatus;
  });

  const stats = {
    total: integrations.length,
    connected: integrations.filter(i => i.status === 'connected').length,
    pending: integrations.filter(i => i.status === 'pending').length,
    disabled: integrations.filter(i => i.status === 'disabled' || i.status === 'revoked').length,
  };

  return (
    <div className="min-h-full bg-zinc-50">
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={(key) => {
            setShowCreate(false);
            void load().then(() => {
              // get name from latest integrations
              setNewKey({ key, name: 'New Integration' });
            });
          }}
        />
      )}
      {newKey && <KeyRevealModal sdkKey={newKey.key} name={newKey.name} onClose={() => setNewKey(null)} />}

      {/* Header */}
      <div className="border-b border-zinc-200 bg-white px-8 py-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="m-0 text-2xl font-black text-zinc-900 flex items-center gap-2">
              <Shield className="text-olive-600" size={24} />SDK Integrations
            </h2>
            <p className="m-0 mt-1 text-sm text-zinc-500">Connect external websites · Generate SDK Keys · Manage authentication</p>
          </div>
          <button
            onClick={() => setShowCreate(true)} type="button"
            className="flex items-center gap-2 rounded-xl bg-olive-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-olive-800 shadow-sm transition-colors"
          >
            <Plus size={16} />New Integration
          </button>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: <Globe size={15} />, cls: 'text-zinc-600' },
            { label: 'Connected', value: stats.connected, icon: <CheckCircle2 size={15} />, cls: 'text-emerald-600' },
            { label: 'Pending', value: stats.pending, icon: <Clock size={15} />, cls: 'text-amber-600' },
            { label: 'Inactive', value: stats.disabled, icon: <WifiOff size={15} />, cls: 'text-red-500' },
          ].map(({ label, value, icon, cls }) => (
            <div key={label} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 flex items-center gap-3">
              <span className={cls}>{icon}</span>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-zinc-800">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 px-8 py-4 border-b border-zinc-200 bg-white/60">
        <input
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-olive-400 w-56"
          placeholder="Search integrations…" value={search} onChange={e => setSearch(e.target.value)}
        />
        <select className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none" value={filterEnv} onChange={e => setFilterEnv(e.target.value as typeof filterEnv)}>
          <option value="all">All Environments</option>
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>
        <select className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none" value={filterStatus} onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="connected">Connected</option>
          <option value="disabled">Disabled</option>
          <option value="revoked">Revoked</option>
        </select>
        <span className="text-xs text-zinc-400 ml-auto">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Content */}
      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-zinc-400">
            <Loader2 className="animate-spin mr-2" size={20} />Loading integrations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-2xl bg-white border border-zinc-200 p-10 max-w-sm shadow-sm">
              <Server size={40} className="text-zinc-300 mx-auto mb-4" />
              <h3 className="text-base font-bold text-zinc-700 mb-2">
                {integrations.length === 0 ? 'No integrations yet' : 'No results'}
              </h3>
              <p className="text-sm text-zinc-400 mb-5">
                {integrations.length === 0
                  ? 'Create your first SDK integration to connect an external website to the Engagement Platform.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {integrations.length === 0 && (
                <button onClick={() => setShowCreate(true)} type="button"
                  className="flex items-center gap-2 mx-auto rounded-xl bg-olive-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-olive-800">
                  <Plus size={15} />Create Integration
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(i => (
              <IntegrationCard key={i.id} integration={i} onRefresh={load} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
