import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  User,
  Search,
  ChevronRight,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronLeft
} from 'lucide-react';
import {
  listApiKeys,
  createApiKey,
  deleteApiKey,
  AnalyticsKey,
  getAnalyticsEvents,
  RawEvent
} from '@/services/eventTracking';
import Modal from '@/components/Modal';
import noDataImage from '@/assets/no_data.png';
import { Activity } from 'lucide-react';
import Skeleton from '@/components/Skeleton';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';

import DataTable from '@/components/DataTable';

const columnHelper = createColumnHelper<RawEvent>();

const columns = [
  columnHelper.accessor('_id', {
    header: 'Status',
    size: 80,
    cell: () => (
      <div className="flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-emerald-500" title="Ingested" />
      </div>
    ),
  }),
  columnHelper.accessor('userId', {
    header: 'Identity',
    size: 250,
    cell: info => (
      <div className="flex items-center gap-3">
        <User size={16} className="text-zinc-400" />
        <strong className="text-olive-900 dark:text-slate-100 font-bold text-[0.95rem]">
          {info.getValue() || 'Anonymous'}
        </strong>
      </div>
    ),
  }),
  columnHelper.accessor('eventName', {
    header: 'Signal',
    size: 200,
    cell: info => {
      const name = info.getValue();
      const getEventColor = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('identify')) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        if (lowerName.includes('page') || lowerName.includes('view')) return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        if (lowerName.includes('click') || lowerName.includes('select')) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
        if (lowerName.includes('error') || lowerName.includes('fail')) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
        return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-800/50';
      };
      return (
        <span className={`px-2 py-0.5 rounded text-[0.75rem] font-bold uppercase tracking-tight ${getEventColor(name)}`}>
          {name.replace(/_/g, ' ')}
        </span>
      );
    },
  }),
  columnHelper.accessor('timestamp', {
    id: 'date',
    header: 'Date',
    size: 120,
    cell: info => new Date(info.getValue()).toLocaleDateString([], { month: 'short', day: 'numeric' }),
  }),
  columnHelper.accessor('timestamp', {
    id: 'time',
    header: 'Time',
    size: 100,
    cell: info => new Date(info.getValue()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }),
  columnHelper.display({
    id: 'actions',
    header: '',
    size: 60,
    cell: info => {
      // Handled in DataTable's expanded state logic or row click
      return null;
    },
  }),
];

const EventTrackingPage: React.FC = () => {
  const [keys, setKeys] = useState<AnalyticsKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [rawLogs, setRawLogs] = useState<RawEvent[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI states
  const [isNodeSwitcherOpen, setIsNodeSwitcherOpen] = useState(false);
  const [isManageKeysModalOpen, setIsManageKeysModalOpen] = useState(false);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<AnalyticsKey | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const apiKeys = await listApiKeys();
      setKeys(apiKeys);
      if (apiKeys.length > 0) {
        setSelectedKeyId(apiKeys[0].id);
      }
    } catch (err) {
      console.error('Failed to load API keys', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (keyId: string, page: number) => {
    setRefreshing(true);
    try {
      const offset = (page - 1) * pageSize;
      const data = await getAnalyticsEvents({
        keyId,
        limit: pageSize,
        offset,
        eventName: searchTerm || undefined
      });
      setRawLogs(data.events);
      setTotalLogs(data.total);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedKeyId) {
      setCurrentPage(1);
      loadLogs(selectedKeyId, 1);
    }
  }, [selectedKeyId, searchTerm]);

  useEffect(() => {
    if (selectedKeyId) {
      loadLogs(selectedKeyId, currentPage);
    }
  }, [currentPage]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const newKey = await createApiKey(newKeyName);
      setNewlyCreatedKey(newKey);
      setIsCreateKeyModalOpen(false);
      setNewKeyName('');
      const updatedKeys = await listApiKeys();
      setKeys(updatedKeys);
      if (!selectedKeyId) setSelectedKeyId(newKey.id);
    } catch (err) {
      console.error('Failed to create API key', err);
    }
  };

  const handleDeleteKey = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the API key "${name}"? This action is irreversible.`)) return;
    try {
      await deleteApiKey(id);
      const updatedKeys = await listApiKeys();
      setKeys(updatedKeys);
      if (selectedKeyId === id) {
        setSelectedKeyId(updatedKeys[0]?.id || '');
      }
    } catch (err) {
      console.error('Failed to delete API key', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const activeKey = useMemo(() => {
    return keys.find(k => k.id === selectedKeyId);
  }, [keys, selectedKeyId]);








  const table = useReactTable({
    data: rawLogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = Math.ceil(totalLogs / pageSize);
  const thCls = 'text-left px-5 py-3 text-[0.8rem] font-bold uppercase tracking-[0.05em] text-zinc-500 dark:text-slate-400 bg-zinc-50 dark:bg-slate-800 border-b border-zinc-200 dark:border-slate-700 sticky top-0 z-10';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Clean Toolbar (Matches ProjectPanel) */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800 sticky top-0 z-30">
        <div className="grid gap-0.5">
          <h4 className="m-0 font-bold text-olive-950 dark:text-slate-100 text-[0.95rem]">Event Tracking</h4>
          <span className="text-zinc-400 dark:text-slate-500 text-[0.75rem]">Telemetry Stream Monitoring</span>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-zinc-200 dark:bg-slate-700 opacity-60 mx-2" />

        {/* Optimized Node Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsNodeSwitcherOpen(!isNodeSwitcherOpen)}
            className="flex items-center gap-3 h-9 px-3 bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-[0.85rem] font-medium text-olive-950 dark:text-slate-100 shadow-sm hover:bg-zinc-50 dark:hover:bg-slate-600 transition-colors min-w-[180px] justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              <div className={`w-2 h-2 rounded-full ${activeKey ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
              <span className="truncate">{activeKey ? activeKey.name : 'Select Node'}</span>
            </div>
            <ChevronDown size={14} className="text-zinc-400" />
          </button>

          {isNodeSwitcherOpen && (
            <div className="absolute top-full left-0 mt-1 w-[240px] bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded shadow-xl z-50">
              <div className="py-1">
                {keys.map(key => (
                  <button
                    key={key.id}
                    onClick={() => { setSelectedKeyId(key.id); setIsNodeSwitcherOpen(false); }}
                    className={`w-full px-4 py-2 text-left text-[0.85rem] transition-colors ${selectedKeyId === key.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-700'}`}
                  >
                    {key.name}
                  </button>
                ))}
                <div className="border-t border-zinc-100 dark:border-slate-700 my-1" />
                <button
                  onClick={() => { setIsManageKeysModalOpen(true); setIsNodeSwitcherOpen(false); }}
                  className="w-full px-4 py-2 text-left text-[0.75rem] font-bold text-zinc-500 hover:text-blue-600 transition-colors uppercase tracking-wider"
                >
                  Manage Nodes
                </button>
              </div>
            </div>
          )}
          {isNodeSwitcherOpen && <div className="fixed inset-0 z-40" onClick={() => setIsNodeSwitcherOpen(false)} />}
        </div>

        {/* Search */}
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 text-zinc-400 dark:text-slate-500" size={14} />
          <input
            className="w-full h-9 pl-10 pr-3 text-[0.85rem] bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-md shadow-inner transition-all duration-200 focus:outline-none focus:border-blue-500 text-olive-950 dark:text-slate-100 placeholder:text-zinc-400"
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter interaction signals..."
            type="text"
            value={searchTerm}
          />
        </div>

        <button
          onClick={() => { if (selectedKeyId) loadLogs(selectedKeyId, currentPage); }}
          disabled={refreshing || !selectedKeyId}
          className="inline-flex items-center justify-center w-9 h-9 bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-400 hover:text-blue-600 transition-colors disabled:opacity-30"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {!selectedKeyId ? (
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative">
              <img
                src={noDataImage}
                alt="No Node Selected"
                className="relative w-100 h-100 mx-auto object-contain opacity-90"
              />
            </div>

            <h3 className="text-xl font-bold text-olive-950 dark:text-white mb-2 tracking-tight font-['Outfit']">
              No Node Selected
            </h3>

            <p className="text-zinc-500 dark:text-slate-400 text-sm max-w-[360px] mx-auto mb-8 leading-relaxed">
              Choose a telemetry node from the switcher above to start exploring incoming interaction signals in real-time.
            </p>

            <button
              onClick={() => setIsNodeSwitcherOpen(true)}
              className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-blue-600 dark:bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 dark:hover:bg-blue-500 transform transition-all active:scale-95 duration-200"
              type="button"
            >
              <Activity size={18} strokeWidth={2.5} />
              <span>Select Telemetry Node</span>
            </button>
          </div>
        ) : (
          <DataTable
            table={table}
            loading={refreshing || (loading && rawLogs.length === 0)}
            onRowClick={(event) => setExpandedLogId(expandedLogId === event._id ? null : event._id)}
            stickyHeader={true}
            renderExpandedRow={(event) => (
              <div className="px-10 py-8 space-y-8 animate-in slide-in-from-top-2 duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 bg-olive-600 rounded-full" />
                      <h4 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">Contextual Meta</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-zinc-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest block mb-1">OS Environment</span>
                        <p className="text-[0.8rem] font-bold text-zinc-800 dark:text-slate-200">{event.context?.device?.os || 'System SDK'}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-zinc-100 dark:border-slate-800 shadow-sm">
                        <span className="text-[0.6rem] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Agent Library</span>
                        <p className="text-[0.8rem] font-bold text-zinc-800 dark:text-slate-200">{event.context?.library?.name} v{event.context?.library?.version}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                      <h4 className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-zinc-400">Payload Source</h4>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-5 border border-zinc-800 relative group">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <code className="text-[0.6rem] text-zinc-600 font-mono">RAW_JSON</code>
                      </div>
                      <pre className="text-[0.75rem] text-blue-200/90 font-mono leading-relaxed overflow-x-auto max-h-[300px] custom-scrollbar">
                        <code>{JSON.stringify(event.properties, null, 2)}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
            skeletonRows={10}
            className="flex-1 overflow-y-auto px-4 py-2"
          />
        )}
      </div>

      {/* Simple Pagination Bar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800">
        <div className="text-[0.75rem] text-zinc-400 dark:text-slate-500">
          Page <strong className="text-zinc-700 dark:text-slate-300">{currentPage}</strong> of{' '}
          <strong className="text-zinc-700 dark:text-slate-300">{totalPages || 1}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="w-7 h-7 p-0 flex items-center justify-center bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-500 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            type="button"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="w-7 h-7 p-0 flex items-center justify-center bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-500 dark:text-slate-400 hover:bg-zinc-50 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            type="button"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* --- MODALS --- */}
      {isManageKeysModalOpen && (
        <Modal
          title="Node Management"
          onClose={() => setIsManageKeysModalOpen(false)}
          maxWidth="max-w-[480px]"
        >
          <div className="space-y-6 py-2">
            <div className="p-4 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded flex items-center justify-between">
              <div>
                <h4 className="text-[0.95rem] font-bold text-olive-950 dark:text-white">Provision New Node</h4>
                <p className="text-[0.75rem] text-zinc-500">Add identifiers for fresh telemetry streams.</p>
              </div>
              <button
                onClick={() => setIsCreateKeyModalOpen(true)}
                className="px-4 py-2 bg-olive-900 dark:bg-olive-600 text-white rounded text-sm font-medium hover:bg-olive-800 transition-colors flex items-center gap-2"
              >
                <Plus size={16} /> New Node
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto px-1">
              {keys.map(key => (
                <div
                  key={key.id}
                  className="p-3 rounded border border-zinc-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <strong className="text-[0.9rem] text-olive-950 dark:text-slate-100 truncate">{key.name}</strong>
                      <span className="text-[0.6rem] px-1 bg-emerald-50 text-emerald-600 rounded font-bold uppercase tracking-wide">Active</span>
                    </div>
                    <code className="text-[0.7rem] text-zinc-400 font-mono block mt-0.5">{key.maskedKey}</code>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteKey(key.id, key.name); }}
                    className="p-2 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {isCreateKeyModalOpen && (
        <Modal
          title="Create API Key"
          onClose={() => setIsCreateKeyModalOpen(false)}
          maxWidth="max-w-[400px]"
        >
          <form onSubmit={handleCreateKey} className="space-y-6 pt-2">
            <div>
              <label className="block text-[0.75rem] font-bold text-zinc-500 uppercase tracking-wider mb-2">Node Name</label>
              <input
                autoFocus
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Client"
                className="w-full h-10 px-3 bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-[0.9rem] focus:outline-none focus:border-blue-500 transition-all font-medium"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreateKeyModalOpen(false)}
                className="flex-1 h-10 bg-zinc-100 dark:bg-slate-700 text-[0.85rem] font-bold text-zinc-500 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newKeyName.trim()}
                className="flex-1 h-10 bg-olive-900 dark:bg-olive-600 text-white rounded font-bold text-[0.85rem] shadow-lg shadow-olive-900/20 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {newlyCreatedKey && (
        <Modal
          title="Node Key Created"
          onClose={() => setNewlyCreatedKey(null)}
          maxWidth="max-w-[400px]"
        >
          <div className="space-y-6 pt-2">
            <div className="p-5 bg-slate-900 rounded border border-slate-800 space-y-3">
              <span className="text-[0.65rem] font-bold text-blue-400 uppercase tracking-widest block text-center">Secret API Key</span>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/5">
                <code className="text-[0.95rem] font-bold font-mono text-blue-100 break-all flex-1 text-center">{newlyCreatedKey.key}</code>
                <button
                  onClick={() => copyToClipboard(newlyCreatedKey.key || '')}
                  className="p-2 text-white/50 hover:text-white transition-colors"
                >
                  {copiedKey ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                </button>
              </div>
            </div>
            <p className="text-[0.7rem] text-amber-600 font-bold uppercase tracking-widest text-center px-2 italic">
              Warning: This is the only time this key will be displayed.
            </p>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="w-full h-11 bg-zinc-100 dark:bg-slate-700 text-olive-950 dark:text-white rounded font-bold transition-all border border-zinc-200 dark:border-slate-700"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EventTrackingPage;
