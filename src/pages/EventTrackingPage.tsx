import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
  Loader2,
  Filter,
  BookOpen,
  X
} from 'lucide-react';
import {
  listApiKeys,
  createApiKey,
  deleteApiKey,
  AnalyticsKey,
  getAnalyticsEvents,
  getEventLogs,
  getTrackedEvents,
  RawEvent,
  EventLog,
  TrackedEvent
} from '@/services/eventTracking';
import Modal from '@/components/Modal';
import { useConfirm } from '@/context/ConfirmationContext';
import { Activity } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  createColumnHelper,
  ExpandedState,
} from '@tanstack/react-table';

import DataTable from '@/components/DataTable';

const columnHelper = createColumnHelper<RawEvent>();

const columns = [
  columnHelper.accessor('userId', {
    header: 'Identity',
    size: 200,
    cell: info => {
      const value = info.getValue() || '-';
      return (
        <div className="flex items-center gap-1 min-w-0">
          <strong className="text-zinc-600 dark:text-slate-400 font-mono text-[0.78rem] truncate">
            {value}
          </strong>
        </div>
      );
    },
  }),
  columnHelper.accessor('eventName', {
    header: 'Signal',
    size: 200,
    cell: info => {
      const name = info.getValue();
      const getEventStyle = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('identify')) return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30';
        if (lowerName.includes('page') || lowerName.includes('view') || lowerName.includes('list')) return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30';
        if (lowerName.includes('click') || lowerName.includes('select') || lowerName.includes('create')) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30';
        if (lowerName.includes('error') || lowerName.includes('fail')) return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/30';
        return 'text-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200/50 dark:border-slate-700/50';
      };

      return (
        <span className={`px-2.5 py-1 rounded-md text-[0.72rem] font-bold uppercase border ${getEventStyle(name)}`}>
          {name.replace(/_/g, ' ')}
        </span>
      );
    },
  }),
  columnHelper.accessor('timestamp', {
    id: 'date',
    header: 'Date',
    size: 140,
    cell: info => (
      <div className="text-[0.78rem] font-mono font-bold text-slate-400 dark:text-slate-500">
        {new Date(info.getValue()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
      </div>
    ),
  }),
  columnHelper.accessor('timestamp', {
    id: 'time',
    header: 'Time',
    size: 100,
    cell: info => (
      <div className="text-[0.8rem] font-mono font-black text-olive-950 dark:text-blue-100">
        {new Date(info.getValue()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </div>
    ),
  }),
  columnHelper.display({
    id: 'expander',
    header: '',
    size: 40,
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      return (
        <div className="flex justify-end pr-2">
          <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown
              size={18}
              className={`transition-colors duration-200 ${isExpanded ? 'text-olive-600 dark:text-blue-400' : 'text-zinc-300 dark:text-slate-600'}`}
            />
          </div>
        </div>
      );
    },
  }),
];

const MultiSelect = ({
  options,
  selected,
  onChange,
  placeholder = "Select events..."
}: {
  options: string[],
  selected: string[],
  onChange: (selected: string[]) => void,
  placeholder?: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const remainingOptions = options.filter(opt => !selected.includes(opt));

  return (
    <div className="relative">
      <div
        className="min-h-[42px] p-2 flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-900 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-olive-500/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selected.length === 0 && (
          <span className="px-2 py-1 text-sm text-zinc-400">{placeholder}</span>
        )}
        {selected.map(item => (
          <span key={item} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-slate-800 text-[0.75rem] font-bold text-zinc-700 dark:text-slate-300 border border-zinc-200 dark:border-slate-700">
            {item.replace(/_/g, ' ')}
            <X
              size={14}
              className="cursor-pointer hover:text-rose-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange(selected.filter(i => i !== item));
              }}
            />
          </span>
        ))}
      </div>

      {isOpen && remainingOptions.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[220px] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 animate-in fade-in slide-in-from-top-1 duration-200 p-1">
            {remainingOptions.map(opt => (
              <div
                key={opt}
                className="px-3 py-2.5 rounded-lg text-sm text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-800 cursor-pointer transition-colors font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange([...selected, opt]);
                  setIsOpen(false);
                }}
              >
                {opt.replace(/_/g, ' ')}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface EventTrackingPageProps {
  onOpenDocs?: () => void;
}

const EventTrackingPage: React.FC<EventTrackingPageProps> = ({ onOpenDocs }) => {
  const confirm = useConfirm();
  const [keys, setKeys] = useState<AnalyticsKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [rawLogs, setRawLogs] = useState<RawEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(30);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI states
  const [isNodeSwitcherOpen, setIsNodeSwitcherOpen] = useState(false);
  const [isManageKeysModalOpen, setIsManageKeysModalOpen] = useState(false);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<AnalyticsKey | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [logDetails, setLogDetails] = useState<Record<string, EventLog>>({});
  const [fetchingPayloadId, setFetchingPayloadId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);
  const [availableEvents, setAvailableEvents] = useState<TrackedEvent[]>([]);
  const [draftFilters, setDraftFilters] = useState({
    eventNames: [] as string[],
    startDate: '',
    endDate: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    eventNames: [] as string[],
    startDate: '',
    endDate: ''
  });

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
      const data = await getAnalyticsEvents({
        apiKeyId: keyId,
        page,
        limit: pageSize,
        eventNames: appliedFilters.eventNames.length > 0 ? appliedFilters.eventNames : undefined,
        startDate: appliedFilters.startDate || undefined,
        endDate: appliedFilters.endDate || undefined
      });
      setRawLogs(data.events);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setRefreshing(false);
    }
  };

  const loadAvailableEvents = async (keyId: string) => {
    try {
      const data = await getTrackedEvents(keyId);
      setAvailableEvents(data);
    } catch (err) {
      console.error('Failed to load available events', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedKeyId) {
      setCurrentPage(1);
      void loadAvailableEvents(selectedKeyId);
      loadLogs(selectedKeyId, 1);
    }
  }, [selectedKeyId, appliedFilters]);

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
    const isConfirmed = await confirm({
      title: 'Delete Telemetry Node',
      message: `Are you sure you want to delete the API key "${name}"? This action is irreversible and all events tracked with this key will no longer be visible.`,
      confirmText: 'Delete Node',
      type: 'danger'
    });

    if (!isConfirmed) return;

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
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row._id,
  });

  const toggleRow = async (event: RawEvent) => {
    const row = table.getRow(event._id);
    if (!row) return;

    const isExpanding = !row.getIsExpanded();

    // Mutual exclusivity: Close all others if we are expanding
    if (isExpanding) {
      table.toggleAllRowsExpanded(false);
    }

    row.toggleExpanded();

    if (isExpanding && !logDetails[event._id] && selectedKeyId) {
      setFetchingPayloadId(event._id);
      try {
        const logs = await getEventLogs(event._id, selectedKeyId);
        if (logs && logs.length > 0) {
          setLogDetails(prev => ({ ...prev, [event._id]: logs[0] }));
        }
      } catch (err) {
        console.error('Failed to fetch payload details', err);
      } finally {
        setFetchingPayloadId(null);
      }
    }
  };

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
                    className={`w-full py-2 text-left text-[0.85rem] transition-colors ${selectedKeyId === key.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-700'}`}
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

        <div className="flex-1" />

        <button
          className="inline-flex items-center gap-2 h-9 px-4 bg-olive-900 dark:bg-olive-600 rounded text-[0.85rem] font-semibold text-white shadow-sm hover:bg-olive-800 dark:hover:bg-olive-500 transition-colors"
          onClick={() => onOpenDocs?.()}
          type="button"
        >
          <BookOpen size={14} />
          <span>SDK Documentation</span>
        </button>

        <button
          className="inline-flex items-center gap-2 h-9 px-4 bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-[0.85rem] font-medium text-zinc-600 dark:text-slate-200 shadow-sm hover:bg-zinc-50 dark:hover:bg-slate-600 transition-colors"
          onClick={() => {
            setDraftFilters(appliedFilters);
            setIsFiltersModalOpen(true);
          }}
          type="button"
        >
          <Filter size={14} />
          <span>Filters</span>
          {appliedFilters.eventNames.length > 0 || appliedFilters.startDate || appliedFilters.endDate ? (
            <span className="rounded-full bg-olive-900 px-1.5 py-0.5 text-[0.65rem] font-bold text-white dark:bg-olive-600">
              {appliedFilters.eventNames.length + (appliedFilters.startDate ? 1 : 0) + (appliedFilters.endDate ? 1 : 0)}
            </span>
          ) : null}
        </button>

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
          <div className="flex-1 flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-500 bg-white dark:bg-slate-900">
            <div className="relative mb-6">
              <img
                src="https://res.cloudinary.com/diqzswlyr/image/upload/q_auto/f_auto/v1776863078/no_data_lyzl4t.png"
                alt="No Node Selected"
                className="relative w-82 h-82 mx-auto object-contain opacity-90"
              />
            </div>

            <h3 className="text-2xl font-black text-olive-950 dark:text-white mb-3 tracking-tighter font-['Outfit']">
              Telemetry Node Required
            </h3>

            <p className="text-zinc-500 dark:text-slate-400 text-[0.9rem] max-w-[420px] mx-auto mb-10 leading-relaxed font-medium">
              Start monitoring your synchronization ecosystem. Select a telemetry node from the dashboard above to explore incoming interaction signals in real-time.
            </p>

            <button
              onClick={() => setIsNodeSwitcherOpen(true)}
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-olive-900 dark:bg-olive-600 text-white rounded-xl text-sm font-black shadow-2xl shadow-olive-900/30 hover:bg-olive-800 dark:hover:bg-olive-500 transform transition-all active:scale-95 duration-200 uppercase tracking-[0.1em]"
              type="button"
            >
              <Activity size={20} strokeWidth={3} className="text-olive-300" />
              <span>Provision Tracking Node</span>
            </button>
          </div>
        ) : (
          <DataTable
            table={table}
            loading={refreshing || (loading && rawLogs.length === 0)}
            onRowClick={toggleRow}
            stickyHeader={true}
            tableClassName="border-separate border-spacing-y-0"
            renderExpandedRow={(event) => {
              const details = logDetails[event._id];
              const isFetching = fetchingPayloadId === event._id;

              return (
                <div className="pb-8 pt-2 animate-in slide-in-from-top-3 duration-500 ease-out">
                  <div className="flex flex-col p-8 transition-all">

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-6 bg-olive-600 dark:bg-blue-500 rounded-full" />
                        <h4 className="text-[0.72rem] font-bold uppercase text-zinc-500 dark:text-slate-400">
                          {event.eventName.replace(/_/g, ' ')} <span className="opacity-30 mx-2">•</span> <span className="text-zinc-400 dark:text-slate-500 font-medium font-mono">RAW LOG DATA</span>
                        </h4>
                      </div>
                    </div>

                    {isFetching ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4 text-olive-500/40">
                        <Loader2 size={32} className="animate-spin" />
                        <span className="text-[0.65rem] font-black uppercase">Syncing Payload...</span>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-950 border border-slate-800/80 shadow-inner p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none transition-opacity group-hover:opacity-[0.06]">
                          <Activity size={120} className="text-white" />
                        </div>
                        <pre className="text-[0.88rem] font-mono leading-relaxed overflow-x-auto max-h-[500px] custom-scrollbar scrollbar-dark text-blue-50 relative z-10">
                          <code>{JSON.stringify(event.payload || details.payload, null, 2)}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            }}
            skeletonRows={10}
            className="flex-1 overflow-y-auto px-4"
            pagination={{
              page: currentPage,
              totalPages: totalPages || 1,
              onPageChange: setCurrentPage
            }}
            emptyMessage="No event logs match current filters"
          />
        )}
      </div>

      {/* --- MODALS --- */}
      {isFiltersModalOpen && (
        <Modal
          title="Filter Event Logs"
          onClose={() => {
            setDraftFilters(appliedFilters);
            setIsFiltersModalOpen(false);
          }}
          maxWidth="max-w-[520px]"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[0.75rem] font-bold text-zinc-500 uppercase tracking-wider">
                Events
              </label>
              <MultiSelect
                options={availableEvents.map(e => e.eventName)}
                selected={draftFilters.eventNames}
                onChange={(eventNames) => setDraftFilters(prev => ({ ...prev, eventNames }))}
                placeholder="Choose events to monitor..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-[0.75rem] font-bold text-zinc-500 uppercase tracking-wider">Start date</span>
                <input
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                  onChange={(event) => setDraftFilters((current) => ({ ...current, startDate: event.target.value }))}
                  type="date"
                  value={draftFilters.startDate}
                />
              </label>
              <label className="grid gap-2">
                <span className="text-[0.75rem] font-bold text-zinc-500 uppercase tracking-wider">End date</span>
                <input
                  className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
                  onChange={(event) => setDraftFilters((current) => ({ ...current, endDate: event.target.value }))}
                  type="date"
                  value={draftFilters.endDate}
                />
              </label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => {
                  setDraftFilters({ eventNames: [], startDate: '', endDate: '' });
                  setAppliedFilters({ eventNames: [], startDate: '', endDate: '' });
                  setCurrentPage(1);
                  setIsFiltersModalOpen(false);
                }}
                type="button"
              >
                Reset
              </button>
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => {
                    setDraftFilters(appliedFilters);
                    setIsFiltersModalOpen(false);
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg bg-olive-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-olive-800 dark:bg-olive-600 dark:hover:bg-olive-500"
                  onClick={() => {
                    setAppliedFilters(draftFilters);
                    setCurrentPage(1);
                    setIsFiltersModalOpen(false);
                  }}
                  type="button"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
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
