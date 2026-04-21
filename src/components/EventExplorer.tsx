import React, { useState, useEffect } from 'react';
import {
  Search,
  Clock,
  User,
  Monitor,
  Smartphone,
  Globe,
  ChevronDown,
  ChevronUp,
  Code
} from 'lucide-react';
import { getAnalyticsEvents, RawEvent } from '@/services/eventTracking';
import {
  useReactTable,
  getCoreRowModel,
  createColumnHelper,
} from '@tanstack/react-table';
import DataTable from './DataTable';

const columnHelper = createColumnHelper<RawEvent>();

interface EventExplorerProps {
  selectedKeyId?: string;
}

const EventExplorer: React.FC<EventExplorerProps> = ({ selectedKeyId }) => {
  const [events, setEvents] = useState<RawEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getAnalyticsEvents({
        keyId: selectedKeyId,
        eventName: searchTerm || undefined,
        limit: 20
      });
      setEvents(data.events);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEvents();
  }, [selectedKeyId, searchTerm]);

  const getDeviceIcon = (os: string = '') => {
    if (os.includes('Android') || os.includes('iOS')) return <Smartphone size={14} />;
    return <Monitor size={14} />;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const columns = React.useMemo(() => [
    columnHelper.accessor('timestamp', {
      header: 'Timestamp',
      size: 180,
      cell: info => (
        <div className="flex items-center gap-2 text-[0.75rem] font-medium text-zinc-500 dark:text-slate-400">
          <Clock size={12} className="text-zinc-400" />
          {formatDate(info.getValue())}
        </div>
      ),
    }),
    columnHelper.accessor('eventName', {
      header: 'Event',
      size: 150,
      cell: info => {
        const name = info.getValue();
        return (
          <span className={`text-[0.7rem] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${name.startsWith('page') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
            name.startsWith('identify') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
              'bg-zinc-500/10 text-zinc-700 dark:text-slate-300'
            }`}>
            {name.replace(/_/g, ' ')}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'context',
      header: 'Context',
      size: 200,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-slate-400" title={row.original.context?.device?.os}>
            {getDeviceIcon(row.original.context?.device?.os)}
            <span className="text-[0.68rem] font-bold">{row.original.context?.device?.browser || 'SDK'}</span>
          </div>
          <div className="text-zinc-300">|</div>
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-slate-400">
            <User size={12} className="text-zinc-400" />
            <span className="text-[0.68rem] font-bold max-w-[80px] truncate">{row.original.userId || 'anon'}</span>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('sessionId', {
      header: 'Session',
      size: 150,
      cell: info => (
        <code className="text-[0.63rem] font-mono text-zinc-400 bg-zinc-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
          {info.getValue().substring(0, 8)}...
        </code>
      ),
    }),
    columnHelper.display({
      id: 'properties',
      header: () => <div className="text-right">Properties</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="text-right">
          <div className="text-zinc-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors inline-block p-1">
            {expandedEventId === row.original._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      ),
    }),
  ], [expandedEventId]);

  const table = useReactTable({
    data: events,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-zinc-200/80 dark:border-slate-700/80 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-zinc-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/30 dark:bg-slate-900/50">
        <div>
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-olive-600 dark:text-blue-300">
            Observation Log
          </span>
          <h3 className="font-['Outfit'] font-bold text-[1.1rem] text-olive-950 dark:text-white mt-1">Event Explorer</h3>
        </div>

        <div className="relative group flex-1 md:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-blue-500 transition-colors">
            <Search size={16} />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-white dark:bg-slate-950 border border-zinc-200 dark:border-slate-800 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-400"
            placeholder="Search event types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DataTable
        table={table}
        loading={loading && events.length === 0}
        onRowClick={(event) => setExpandedEventId(expandedEventId === event._id ? null : event._id)}
        renderExpandedRow={(event) => (
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-[0.63rem] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-2">
                  <Code size={12} />
                  Payload Properties
                </p>
                <div className="bg-slate-900 rounded-lg p-5 border border-zinc-800 overflow-x-auto shadow-inner">
                  <pre className="text-[0.8rem] text-blue-200/90 font-mono leading-relaxed">
                    <code>{JSON.stringify(event.properties, null, 2)}</code>
                  </pre>
                </div>
              </div>
              <div>
                <p className="text-[0.63rem] font-black uppercase tracking-[0.2em] text-zinc-400 mb-3 flex items-center gap-2">
                  <Globe size={12} />
                  Environment Details
                </p>
                <div className="bg-white dark:bg-slate-950 rounded-lg p-5 border border-zinc-200 dark:border-slate-800 font-medium space-y-3 shadow-sm">
                  <div className="flex justify-between border-b border-zinc-100 dark:border-slate-900 pb-2">
                    <span className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Library</span>
                    <span className="text-[0.75rem] font-bold text-olive-950 dark:text-slate-300">{event.context?.library?.name} v{event.context?.library?.version}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 dark:border-slate-900 pb-2">
                    <span className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Screen</span>
                    <span className="text-[0.75rem] font-bold text-olive-950 dark:text-slate-300">{event.context?.device?.screen || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b border-zinc-100 dark:border-slate-900 pb-2">
                    <span className="text-[0.65rem] text-zinc-500 uppercase tracking-wider">Language</span>
                    <span className="text-[0.75rem] font-bold text-olive-950 dark:text-slate-300">{event.context?.device?.language || 'N/A'}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-[0.65rem] text-zinc-500 uppercase tracking-wider block mb-1">Page URL</span>
                    <span className="text-[0.72rem] font-bold text-blue-600 dark:text-blue-400 break-all">{event.context?.page?.url || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        skeletonRows={5}
        stickyHeader={true}
        className="flex-1 overflow-y-auto"
      />

      <div className="p-4 border-t border-zinc-100 dark:border-slate-800 bg-zinc-50/50 dark:bg-slate-900/80 flex items-center justify-between">
        <p className="text-[0.65rem] font-bold text-zinc-400 uppercase tracking-widest">Showing {events.length} most recent signals</p>
        <button
          onClick={() => fetchEvents()}
          className="text-[0.65rem] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1.5 transition-colors"
        >
          Refresh Log
        </button>
      </div>
    </div>
  );
};

export default EventExplorer;
