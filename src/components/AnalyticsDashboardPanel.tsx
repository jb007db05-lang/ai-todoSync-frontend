import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart3, 
  Key, 
  Plus, 
  RotateCcw, 
  CheckCircle2,
  RefreshCw,
  Activity,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Terminal,
  Eye,
  EyeOff,
  ExternalLink,
  User,
  Globe
} from 'lucide-react';
import { 
  getAnalyticsKeys, 
  generateAnalyticsKey, 
  revokeAnalyticsKey, 
  regenerateAnalyticsKey,
  getAnalyticsStats,
  AnalyticsKey,
  AnalyticsStats 
} from '../services/analytics';
import GlobalLoader from './GlobalLoader';
import Modal from './Modal';

import EventExplorer from './EventExplorer';

const AnalyticsDashboardPanel: React.FC = () => {
  const [keys, setKeys] = useState<AnalyticsKey[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | undefined>(undefined);
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<AnalyticsKey | null>(null);
  const [isManageKeysModalOpen, setIsManageKeysModalOpen] = useState(false);
  const [showFullKeyInSnippet, setShowFullKeyInSnippet] = useState(false);
  
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const loadKeys = async () => {
    try {
      const keysData = await getAnalyticsKeys();
      setKeys(keysData);
      return keysData;
    } catch (err) {
      console.error('Failed to load keys', err);
      return [];
    }
  };

  const loadStats = async (keyId?: string) => {
    setStatsLoading(true);
    try {
      const statsData = await getAnalyticsStats(keyId);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadKeys(), loadStats()]);
      setLoading(false);
    };
    void init();
  }, []);

  // Re-fetch stats when selected key changes
  useEffect(() => {
    if (!loading) {
      void loadStats(selectedKeyId);
      // Reset snippet visibility when switching keys
      setShowFullKeyInSnippet(false);
    }
  }, [selectedKeyId, loading]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const newKey = await generateAnalyticsKey(newKeyName);
      setNewlyCreatedKey(newKey);
      setIsCreateModalOpen(false);
      setNewKeyName('');
      await loadKeys();
    } catch (err) {
      console.error('Failed to generate key', err);
    } finally {
      setCreating(false);
    }
  };

  const handleRegenerateKey = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to regenerate the key "${name}"? The old key will stop working immediately.`)) {
      return;
    }

    try {
      const newKey = await regenerateAnalyticsKey(id);
      setNewlyCreatedKey(newKey);
      await loadKeys();
    } catch (err) {
      console.error('Failed to regenerate key', err);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to revoke the key "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await revokeAnalyticsKey(id);
      await loadKeys();
      if (selectedKeyId === id) {
        setSelectedKeyId(undefined);
      }
    } catch (err) {
      console.error('Failed to revoke key', err);
    }
  };

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    const lastFour = key.slice(-4);
    return `ak_••••••••${lastFour}`;
  };

  const activeKey = useMemo(() => {
    return keys.find(k => k.id === selectedKeyId) || keys.filter(k => k.status === 'active')[0];
  }, [keys, selectedKeyId]);

  const sdkSnippet = useMemo(() => {
    const apiKey = activeKey ? activeKey.key : 'YOUR_API_KEY';
    const displayKey = activeKey && selectedKeyId === activeKey.id 
      ? (showFullKeyInSnippet ? apiKey : maskKey(apiKey)) 
      : 'YOUR_API_KEY';
    
    return `import { AnalyticsSDK } from '@my-org/analytics-sdk';

const analytics = new AnalyticsSDK({
  apiKey: '${displayKey}',
  autoPageTrack: true,
  debug: true
});

// Identify a user
analytics.identify('user_123', {
  name: 'John Doe',
  plan: 'pro'
});

// Track a custom event
analytics.track('item_purchased', {
  price: 49.99,
  currency: 'USD'
});`;
  }, [activeKey, selectedKeyId, showFullKeyInSnippet]);

  if (loading) return <GlobalLoader message="Loading analytics console..." />;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-zinc-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-blue-500/5 blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
          <div className="flex items-start justify-between mb-4">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
              Total events
            </span>
            <Activity size={18} className="text-blue-500 opacity-60" />
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold font-['Outfit'] text-olive-950 dark:text-white">
              {statsLoading ? '...' : stats?.totalEvents.toLocaleString()}
            </h4>
          </div>
          <p className="text-[0.65rem] text-zinc-400 dark:text-slate-500 font-bold mt-2 flex items-center gap-1 uppercase tracking-wider">
            {selectedKeyId ? 'Filtered by key' : 'Across all keys'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-zinc-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-emerald-500/5 blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-start justify-between mb-4">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
              Unique Users
            </span>
            <User size={18} className="text-emerald-500 opacity-60" />
          </div>
          <h4 className="text-2xl font-bold font-['Outfit'] text-olive-950 dark:text-white">
            {statsLoading ? '...' : stats?.uniqueUsers.toLocaleString()}
          </h4>
          <p className="text-[0.65rem] text-zinc-400 dark:text-slate-500 font-bold mt-2 flex items-center gap-1 uppercase tracking-wider">
            Distinct identities
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-zinc-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-indigo-500/5 blur-2xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-start justify-between mb-4">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
              Sessions
            </span>
            <Globe size={18} className="text-indigo-500 opacity-60" />
          </div>
          <h4 className="text-2xl font-bold font-['Outfit'] text-olive-950 dark:text-white">
            {statsLoading ? '...' : stats?.totalSessions.toLocaleString()}
          </h4>
          <p className="text-[0.65rem] text-zinc-400 dark:text-slate-500 font-bold mt-2 flex items-center gap-1 uppercase tracking-wider">
            Active telemetry windows
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-zinc-200/80 dark:border-slate-700/80 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-amber-500/5 blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-start justify-between mb-4">
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
              Nodes
            </span>
            <Key size={18} className="text-amber-500 opacity-60" />
          </div>
          <h4 className="text-2xl font-bold font-['Outfit'] text-olive-950 dark:text-white">
             {keys.filter(k => k.status === 'active').length}
          </h4>
          <p className="text-[0.65rem] text-zinc-400 dark:text-slate-500 font-bold mt-2 flex items-center gap-1 uppercase tracking-wider text-amber-500/80">
            Securely managed
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-2 border-b border-zinc-100 dark:border-slate-800 pb-6">
        <div>
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
            Observation Focus
          </span>
          <div className="flex items-center gap-3 mt-1">
            <h3 className="font-['Outfit'] font-bold text-xl text-olive-950 dark:text-white">
              {selectedKeyId ? activeKey?.name : 'Global Perspective'}
            </h3>
            <span className={`text-[0.65rem] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest ${selectedKeyId ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'bg-olive-900/10 text-olive-900 dark:bg-olive-500/20 dark:text-olive-300'}`}>
              {selectedKeyId ? 'Isolated Node' : 'Aggregated Network'}
            </span>
          </div>
        </div>

        <button 
          onClick={() => setIsManageKeysModalOpen(true)}
          className="flex items-center gap-2.5 px-5 py-3 bg-white dark:bg-slate-900 border border-zinc-200/80 dark:border-slate-700/80 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95 group"
        >
          <div className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <Key size={16} strokeWidth={2.5} />
          </div>
          <span className="text-xs font-bold text-olive-950 dark:text-slate-200 uppercase tracking-widest">Access Management</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Daily Trends */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-zinc-200/80 dark:border-slate-700/80 shadow-sm p-7 overflow-hidden relative min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
                  Performance
                </span>
                <h3 className="font-['Outfit'] font-bold text-[1.1rem] text-olive-950 dark:text-white mt-1">Trend Analysis</h3>
                <p className="text-[0.65rem] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">
                  {selectedKeyId ? `Node: ${activeKey?.name}` : 'Combined Traffic'}
                </p>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                <BarChart3 size={18} />
              </div>
            </div>

            {statsLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-[1px] z-10 transition-all">
                 <RefreshCw size={24} className="animate-spin text-blue-600" />
              </div>
            ) : null}

            <div className={`h-64 flex items-end justify-between gap-3 px-2 transition-opacity duration-300 ${statsLoading ? 'opacity-30' : 'opacity-100'}`}>
              {stats?.eventsByDay.map((day, i) => {
                const maxCount = Math.max(...stats.eventsByDay.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="relative w-full h-full flex items-end justify-center">
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-olive-950 dark:bg-white text-white dark:text-olive-950 px-3 py-1.5 rounded-lg text-[0.65rem] font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20">
                        {day.count.toLocaleString()} signals
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-olive-950 dark:border-t-white" />
                      </div>
                      <div 
                        style={{ height: `${height}%` }}
                        className={`w-full max-w-[42px] rounded-lg transition-all duration-1000 ease-out group-hover:brightness-110 shadow-sm ${i === stats.eventsByDay.length - 1 ? 'bg-blue-600 shadow-blue-500/20' : 'bg-zinc-100 dark:bg-slate-800'}`}
                      />
                    </div>
                    <span className="text-[0.63rem] font-black text-zinc-400 dark:text-slate-500 uppercase tracking-tighter">
                      {new Date(day.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                  </div>
                );
              })}
              {(!stats || stats.eventsByDay.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-300 dark:text-slate-700 gap-2">
                  <RotateCcw size={32} className="opacity-20 animate-spin-slow" />
                  <p className="font-bold text-[0.7rem] uppercase tracking-widest italic">Awaiting telemetry synchronization...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-200/80 dark:border-slate-700/80 shadow-sm p-7 overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
                    Topology
                  </span>
                  <h3 className="font-['Outfit'] font-bold text-[1.1rem] text-olive-950 dark:text-white mt-1">Signal Distribution</h3>
                  <p className="text-[0.65rem] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1">Most Frequent Types</p>
                </div>
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50">
                  <Activity size={18} />
                </div>
              </div>

              <div className="space-y-6">
                {stats?.eventsByName.map((event, i) => {
                  const maxCount = Math.max(...stats.eventsByName.map(e => e.count), 1);
                  const width = (event.count / maxCount) * 100;
                  return (
                    <div key={event.name} className="space-y-2">
                      <div className="flex items-center justify-between text-[0.68rem] font-bold tracking-[0.1em] uppercase">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`} />
                          <span className="text-olive-950 dark:text-slate-300">{event.name.replace(/_/g, ' ')}</span>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{((event.count / stats.totalEvents) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-50 dark:bg-slate-800/50 rounded-full overflow-hidden border border-zinc-100 dark:border-slate-800">
                        <div 
                          style={{ width: `${width}%` }}
                          className={`h-full rounded-full transition-all duration-1000 ${i === 0 ? 'bg-blue-600 shadow-lg shadow-blue-500/10' : 'bg-slate-300 dark:bg-slate-600'}`}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!stats || stats.eventsByName.length === 0) && (
                  <div className="py-12 border border-dashed border-zinc-200 dark:border-slate-700/60 rounded-xl flex items-center justify-center text-zinc-400 text-[0.7rem] font-bold uppercase tracking-widest bg-zinc-50/50 dark:bg-slate-800/10">
                    No active telemetry signals
                  </div>
                )}
              </div>
          </div>
      </div>

      {/* Event Explorer */}
      <div className="h-[600px]">
        <EventExplorer selectedKeyId={selectedKeyId} />
      </div>

      {/* SDK Integration Guide */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-200/80 dark:border-slate-700/80 p-8 relative overflow-hidden shadow-sm">
         <div className="absolute top-0 right-0 p-8 opacity-5 text-olive-900 dark:text-white">
            <Terminal size={240} />
         </div>
         
         <div className="relative z-10 flex flex-col xl:flex-row gap-12">
            <div className="xl:w-1/3">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-olive-50 dark:bg-olive-900/30 text-olive-600 dark:text-olive-400 rounded-lg border border-olive-100 dark:border-olive-800/50">
                    <Terminal size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
                      Integration
                    </span>
                    <h3 className="text-xl font-bold font-['Outfit'] text-olive-950 dark:text-white">SDK Guide</h3>
                  </div>
               </div>
               
               <p className="text-zinc-500 dark:text-slate-400 text-[0.9rem] leading-relaxed mb-8 font-medium">
                 Connect your application architecture to our global ingestion engine using the official TypeScript SDK. 
                 Real-time observability in seconds.
               </p>

               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[0.74rem] font-bold uppercase tracking-wider text-olive-900 dark:text-slate-300">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[0.74rem] font-bold uppercase tracking-wider text-olive-900 dark:text-slate-300">Sub-millisecond latency</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span className="text-[0.74rem] font-bold uppercase tracking-wider text-olive-900 dark:text-slate-300">Server & Client support</span>
                  </div>
               </div>

               <div className="mt-10 p-5 rounded-xl bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200/60 dark:border-slate-800 flex items-center justify-between group cursor-pointer hover:bg-zinc-100 dark:hover:bg-slate-800 transition-all">
                  <div>
                    <p className="text-[0.65rem] font-black uppercase text-blue-600 mb-0.5">Documentation</p>
                    <p className="text-[0.85rem] font-bold text-olive-950 dark:text-white">API Reference Guide</p>
                  </div>
                  <ExternalLink size={16} className="text-zinc-400 group-hover:text-olive-600 transition-colors" />
               </div>
            </div>

            <div className="xl:flex-1">
               <div className="bg-slate-900 dark:bg-slate-950 rounded-xl border border-zinc-800 dark:border-white/5 overflow-hidden shadow-xl relative group">
                  <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80 dark:bg-slate-900 border-b border-white/5 backdrop-blur-sm">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                       <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                       <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedKeyId && (
                        <div className="flex items-center gap-2">
                           <button 
                            onClick={() => setShowFullKeyInSnippet(!showFullKeyInSnippet)}
                            className="p-1 px-2.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[0.65rem] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5 hover:bg-blue-500/20 transition-all"
                            title={showFullKeyInSnippet ? "Hide Key" : "Reveal Key"}
                           >
                              {showFullKeyInSnippet ? <EyeOff size={12} /> : <Eye size={12} />}
                              {showFullKeyInSnippet ? "HIDE" : "REVEAL"}
                           </button>
                           <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-md">
                              <p className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Key size={10} />
                                {activeKey?.name}
                              </p>
                           </div>
                        </div>
                      )}
                      <button 
                        onClick={() => copyToClipboard(sdkSnippet)}
                        className="p-1.5 px-3.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-[0.7rem] font-bold uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95"
                      >
                        {copiedText === sdkSnippet ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        COPY
                      </button>
                    </div>
                  </div>
                  <div className="p-8 overflow-x-auto h-[260px] custom-scrollbar">
                    <pre className="text-[0.85rem] font-mono leading-relaxed text-blue-200/90">
                      <code>{sdkSnippet}</code>
                    </pre>
                  </div>
                  
                  {!selectedKeyId && (
                    <div className="absolute inset-x-6 bottom-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 backdrop-blur-md flex items-center justify-between animate-in fade-in duration-500">
                      <p className="text-[0.7rem] font-bold text-blue-300 uppercase tracking-widest">Select an API key to inject credentials</p>
                      <Plus size={16} className="text-blue-400 animate-pulse" />
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* --- MODALS --- */}

      {/* Global Key Management Modal */}
      {isManageKeysModalOpen && (
        <Modal 
          title="Manage API Credentials" 
          onClose={() => setIsManageKeysModalOpen(false)}
          maxWidth="max-w-[560px]"
        >
          <div className="space-y-6 py-2">
            <div className="flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-slate-800/30 border border-zinc-200/60 dark:border-slate-700/60 rounded-xl">
               <div>
                 <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">Identity Provisioning</p>
                 <p className="text-[0.85rem] font-bold text-olive-950 dark:text-white mt-0.5">Generate new access keys</p>
               </div>
               <button 
                 onClick={() => setIsCreateModalOpen(true)}
                 className="flex items-center gap-2 px-4 py-2.5 bg-olive-900 dark:bg-blue-600 text-white rounded-lg text-[0.8rem] font-bold shadow-md active:scale-95 transition-all"
               >
                 <Plus size={16} strokeWidth={2.5} />
                 New Key
               </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
               <button
                  onClick={() => { setSelectedKeyId(undefined); setIsManageKeysModalOpen(false); }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${!selectedKeyId ? 'bg-blue-500/5 border-blue-500/40 ring-1 ring-blue-500/10' : 'bg-white dark:bg-slate-900 border-zinc-200 dark:border-slate-800 hover:bg-zinc-50 dark:hover:bg-slate-800/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${!selectedKeyId ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-slate-800 text-zinc-500'}`}>
                      <Activity size={18} />
                    </div>
                    <div>
                      <p className="text-[0.9rem] font-bold text-olive-950 dark:text-slate-100">Global Overview</p>
                      <p className="text-[0.7rem] text-zinc-500 dark:text-slate-400 font-bold uppercase tracking-tight">Combined statistics</p>
                    </div>
                  </div>
                  {!selectedKeyId && <CheckCircle2 size={18} className="text-blue-600" />}
                </button>

               <div className="flex items-center gap-3 my-4">
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-slate-800" />
                  <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-zinc-400">Available Nodes</span>
                  <div className="h-px flex-1 bg-zinc-200 dark:bg-slate-800" />
               </div>

               {keys.map(key => (
                  <div 
                    key={key.id}
                    className={`w-full p-4 rounded-xl border transition-all flex items-center justify-between group ${selectedKeyId === key.id ? 'bg-blue-500/5 border-blue-500/40 ring-1 ring-blue-500/10' : 'bg-white dark:bg-slate-900 border-zinc-200 dark:border-slate-800'} ${key.status === 'revoked' ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div 
                      className="flex-1 cursor-pointer flex items-center gap-4"
                      onClick={() => { setSelectedKeyId(key.id); setIsManageKeysModalOpen(false); }}
                    >
                      <div className={`p-2.5 rounded-lg ${selectedKeyId === key.id ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-slate-800 text-zinc-500'}`}>
                        <Key size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[0.9rem] font-bold text-olive-950 dark:text-slate-100 truncate">{key.name}</p>
                          <span className={`text-[0.55rem] px-1.5 py-0.5 rounded font-black uppercase tracking-widest ${key.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-500/10 text-zinc-500'}`}>
                            {key.status}
                          </span>
                        </div>
                        <code className="text-[0.7rem] font-mono text-zinc-400 mt-0.5 block">{maskKey(key.key)}</code>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleRegenerateKey(key.id, key.name); }}
                        className="p-1 px-2 text-[0.6rem] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-md border border-blue-200/50 dark:border-blue-500/20"
                        title="Rotate Credentials"
                       >
                         REGEN
                       </button>
                       <button 
                        onClick={(e) => { e.stopPropagation(); handleRevokeKey(key.id, key.name); }}
                        className="p-1 px-2 text-[0.6rem] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md border border-red-200/50 dark:border-red-500/20"
                        title="Deactivate Key"
                       >
                         REVOKE
                       </button>
                    </div>
                  </div>
               ))}

              {keys.length === 0 && (
                <div className="py-12 text-center bg-zinc-50/50 dark:bg-slate-800/10 rounded-xl border border-dashed border-zinc-200 dark:border-slate-800">
                  <Key size={32} className="mx-auto text-zinc-200 dark:text-slate-800 mb-3" />
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest italic">Awaiting first credential provision...</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Key Modal */}
      {isCreateModalOpen && (
        <Modal 
          title="New Authentication Key" 
          onClose={() => { if (!creating) setIsCreateModalOpen(false); }}
          maxWidth="max-w-[480px]"
        >
          <div className="space-y-6 py-2">
            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-slate-800/50 border border-zinc-100 dark:border-slate-800/80 rounded-xl">
              <div className="w-12 h-12 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
                <ShieldCheck size={24} />
              </div>
              <div className="flex-1">
                <p className="text-[0.9rem] font-bold text-olive-950 dark:text-white leading-tight">Provision Key</p>
                <p className="text-[0.74rem] text-zinc-500 font-bold uppercase tracking-tight mt-0.5">Secure Application Credential</p>
              </div>
            </div>

            <form onSubmit={handleGenerateKey} className="space-y-4">
              <div>
                <label className="block text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300 mb-2.5 ml-1">Identity Tag</label>
                <input
                  autoFocus
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Mobile Production Node"
                  className="w-full h-12 px-4 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-lg text-[0.9rem] font-bold text-olive-950 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creating}
                  className="flex-1 h-12 text-sm font-bold text-zinc-500 hover:text-olive-950 hover:bg-zinc-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newKeyName.trim()}
                  className="flex-[2] h-12 bg-olive-900 dark:bg-blue-600 hover:bg-olive-800 dark:hover:bg-blue-500 text-white rounded-lg font-bold text-sm shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {creating ? <RotateCcw size={16} className="animate-spin" /> : <Plus size={18} strokeWidth={2.5} />}
                  {creating ? 'GENERATING...' : 'PROVISION KEY'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Success Modal (Full Key Shown ONCE) */}
      {newlyCreatedKey && (
        <Modal 
          title="Credential Provisioned" 
          onClose={() => setNewlyCreatedKey(null)}
          maxWidth="max-w-[500px]"
        >
          <div className="space-y-6 py-2 text-olive-950 dark:text-slate-100">
            <div className="p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex items-center gap-4">
               <div className="p-2.5 bg-emerald-500 text-white rounded-lg shadow-sm">
                 <Check size={20} strokeWidth={3} />
               </div>
               <div>
                  <span className="text-[0.6rem] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
                    Node: {newlyCreatedKey.name}
                  </span>
                  <h4 className="text-[0.95rem] font-bold mt-0.5">API Key provisioned successfully</h4>
               </div>
            </div>

            <div className="p-7 bg-slate-900 dark:bg-slate-950 rounded-xl space-y-4 border border-zinc-800 dark:border-white/5">
               <label className="block text-[0.68rem] font-bold uppercase tracking-[0.18em] text-blue-400 text-center">Secret API Key</label>
               <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/5 rounded-lg group">
                 <code className="flex-1 text-[0.9rem] font-bold font-mono text-blue-200 break-all select-all">
                   {newlyCreatedKey.key}
                 </code>
                 <button 
                  onClick={() => copyToClipboard(newlyCreatedKey.key)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all active:scale-90"
                 >
                   {copiedText === newlyCreatedKey.key ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                 </button>
               </div>
            </div>

            <div className="p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl flex items-start gap-4">
               <AlertTriangle size={20} className="text-amber-600 mt-0.5 shrink-0" />
               <div className="text-[0.8rem] font-medium leading-relaxed">
                 <span className="font-bold text-amber-600 uppercase text-[0.65rem] tracking-widest block mb-1">Security Warning</span>
                 <p className="text-amber-900/80 dark:text-amber-400/80">
                   This key will <span className="font-bold underline decoration-amber-600">not be shown again</span> for security reasons. 
                   Ensure you have securely stored it before proceeding.
                 </p>
               </div>
            </div>

            <button
               onClick={() => setNewlyCreatedKey(null)}
               className="w-full h-14 bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-olive-950 dark:text-white rounded-lg font-bold text-sm uppercase tracking-widest transition-all border border-zinc-200 dark:border-slate-700"
            >
               I have secured my key
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AnalyticsDashboardPanel;
