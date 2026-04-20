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
  Code,
  Calendar,
  Filter,
  Terminal
} from 'lucide-react';
import { getAnalyticsEvents, RawEvent } from '../services/analytics';

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

  const toggleExpand = (id: string) => {
    setExpandedEventId(expandedEventId === id ? null : id);
  };

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

      <div className="overflow-x-auto flex-1 h-[500px] custom-scrollbar">
        {loading && events.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-3">
             <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-[0.7rem] font-bold uppercase tracking-widest">Hydrating events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-300 dark:text-slate-800 gap-4">
             <Terminal size={48} className="opacity-20" />
             <p className="font-bold text-[0.7rem] uppercase tracking-widest italic text-center">
               No telemetry captured yet<br/>
               <span className="text-zinc-500 dark:text-slate-600 mt-1 block">Awaiting incoming signals</span>
             </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-zinc-50 dark:bg-slate-900 z-10 border-b border-zinc-100 dark:border-slate-800">
              <tr className="text-[0.63rem] font-black uppercase tracking-[0.15em] text-zinc-500 dark:text-slate-500">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Context</th>
                <th className="px-6 py-4">Session</th>
                <th className="px-6 py-4 text-right">Properties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 dark:divide-slate-800/50">
              {events.map((event) => (
                <React.Fragment key={event._id}>
                  <tr 
                    className={`group hover:bg-zinc-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${expandedEventId === event._id ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                    onClick={() => toggleExpand(event._id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-[0.75rem] font-medium text-zinc-500 dark:text-slate-400">
                        <Clock size={12} className="text-zinc-400" />
                        {formatDate(event.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-[0.7rem] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        event.eventName.startsWith('page') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        event.eventName.startsWith('identify') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        'bg-zinc-500/10 text-zinc-700 dark:text-slate-300'
                      }`}>
                        {event.eventName.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1.5 text-zinc-500 dark:text-slate-400" title={event.context?.device?.os}>
                            {getDeviceIcon(event.context?.device?.os)}
                            <span className="text-[0.68rem] font-bold">{event.context?.device?.browser || 'SDK'}</span>
                         </div>
                         <div className="text-zinc-300">|</div>
                         <div className="flex items-center gap-1.5 text-zinc-500 dark:text-slate-400">
                            <User size={12} className="text-zinc-400" />
                            <span className="text-[0.68rem] font-bold max-w-[80px] truncate">{event.userId || 'anon'}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <code className="text-[0.63rem] font-mono text-zinc-400 bg-zinc-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                         {event.sessionId.substring(0, 8)}...
                       </code>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="text-zinc-400 group-hover:text-blue-500 transition-colors p-1">
                          {expandedEventId === event._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                       </button>
                    </td>
                  </tr>
                  
                  {expandedEventId === event._id && (
                    <tr className="bg-zinc-50/50 dark:bg-slate-900/50">
                      <td colSpan={5} className="px-8 py-6">
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
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
