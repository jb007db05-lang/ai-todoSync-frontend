import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Key, 
  Activity, 
  User, 
  Search, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Filter,
  Trash2,
  Copy,
  Check,
  Code
} from 'lucide-react';
import { 
  listApiKeys, 
  createApiKey, 
  deleteApiKey, 
  getTrackedEvents, 
  getEventLogs, 
  getIdentifiedUsers,
  getUserEvents,
  AnalyticsKey,
  TrackedEvent,
  EventLog,
  IdentifiedUser
} from '@/services/eventTracking';
import Modal from '@/components/Modal';
import GlobalLoader from '@/components/GlobalLoader';

const EventTrackingPage: React.FC = () => {
  const [keys, setKeys] = useState<AnalyticsKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [events, setEvents] = useState<TrackedEvent[]>([]);
  const [users, setUsers] = useState<IdentifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<AnalyticsKey | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<TrackedEvent | null>(null);
  const [selectedEventLogs, setSelectedEventLogs] = useState<EventLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<IdentifiedUser | null>(null);
  const [selectedUserEvents, setSelectedUserEvents] = useState<EventLog[]>([]);
  
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedKeyId) {
      loadKeyData(selectedKeyId);
    }
  }, [selectedKeyId]);

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

  const loadKeyData = async (keyId: string) => {
    setRefreshing(true);
    try {
      const [eventsList, usersList] = await Promise.all([
        getTrackedEvents(keyId),
        getIdentifiedUsers(keyId)
      ]);
      setEvents(eventsList);
      setUsers(usersList);
    } catch (err) {
      console.error('Failed to load key data', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateKey = async () => {
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

  const handleDeleteKey = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this API key? This action is irreversible.')) return;
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

  const handleShowEventLogs = async (event: TrackedEvent) => {
    setSelectedEvent(event);
    try {
      const logs = await getEventLogs(event.id, selectedKeyId);
      setSelectedEventLogs(logs);
    } catch (err) {
      console.error('Failed to load event logs', err);
    }
  };

  const handleShowUserEvents = async (user: IdentifiedUser) => {
    setSelectedUser(user);
    try {
      const logs = await getUserEvents(user.userIdentifier, selectedKeyId);
      setSelectedUserEvents(logs);
    } catch (err) {
      console.error('Failed to load user events', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading) return <GlobalLoader message="Loading Event Tracking..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header & Key Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-olive-950 dark:text-white font-['Outfit']">Event Tracking</h2>
          <p className="text-zinc-500 dark:text-slate-400 mt-1">Monitor and manage your application telemetry.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative min-w-[240px]">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <select
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-xl font-bold text-olive-950 dark:text-white shadow-sm focus:ring-2 focus:ring-olive-500 outline-none appearance-none"
              value={selectedKeyId}
              onChange={(e) => setSelectedKeyId(e.target.value)}
            >
              {keys.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
              {keys.length === 0 && <option value="">No API Keys found</option>}
            </select>
          </div>
          <button
            onClick={() => setIsCreateKeyModalOpen(true)}
            className="px-5 py-2.5 bg-olive-900 dark:bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            Create Key
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Events Table Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Activity size={20} />
                </div>
                <h3 className="text-lg font-bold text-olive-950 dark:text-white">Tracked Events</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="Filter events..."
                    className="pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-slate-800 border-none rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-zinc-50/50 dark:bg-slate-800/50 text-[0.7rem] uppercase tracking-widest text-zinc-500 font-black">
                  <tr>
                    <th className="px-6 py-4">Event Name</th>
                    <th className="px-6 py-4">Total Count</th>
                    <th className="px-6 py-4">Registered At</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-slate-800">
                  {events.map(event => (
                    <tr key={event.id} className="group hover:bg-zinc-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[0.95rem] font-bold text-olive-950 dark:text-slate-200 font-mono">
                          {event.eventName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-black text-sm">
                            {event.count.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-zinc-500 dark:text-slate-400">
                          {new Date(event.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleShowEventLogs(event)}
                          className="p-2 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="View Logs"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {events.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-zinc-400 italic">
                        No events tracked for this key yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <User size={20} />
                </div>
                <h3 className="text-lg font-bold text-olive-950 dark:text-white">Identified Users</h3>
              </div>
            </div>
            
            <div className="divide-y divide-zinc-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar">
              {users.map(user => (
                <button
                  key={user._id}
                  onClick={() => handleShowUserEvents(user)}
                  className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-slate-800/50 transition-all text-left group"
                >
                  <div className="min-w-0">
                    <p className="text-[0.95rem] font-bold text-olive-950 dark:text-slate-200 truncate pr-4">
                      {user.userIdentifier}
                    </p>
                    <p className="text-[0.75rem] text-zinc-500 dark:text-slate-500 mt-0.5">
                      First seen {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
              {users.length === 0 && (
                <div className="p-12 text-center text-zinc-400 italic">
                  No users identified yet.
                </div>
              )}
            </div>
          </div>

          {/* Key Management Summary */}
          <div className="bg-zinc-900 dark:bg-slate-950 rounded-2xl p-6 text-white space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500">Node Management</h4>
            <div className="space-y-3">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between group">
                   <div className="min-w-0">
                      <p className="text-sm font-bold truncate pr-3">{k.name}</p>
                      <p className="text-[0.65rem] font-mono text-zinc-500 mt-0.5">{k.maskedKey}</p>
                   </div>
                   <button 
                     onClick={() => handleDeleteKey(k.id)}
                     className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Create Key Modal */}
      {isCreateKeyModalOpen && (
        <Modal 
          title="Provision New Node" 
          onClose={() => setIsCreateKeyModalOpen(false)}
          maxWidth="max-w-md"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Node Intent Name</label>
              <input
                autoFocus
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. Production Mobile App"
                className="w-full h-12 px-4 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-olive-500"
              />
            </div>
            <button
              onClick={handleCreateKey}
              disabled={!newKeyName.trim()}
              className="w-full h-14 bg-olive-900 dark:bg-blue-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
            >
              Generate Credentials
            </button>
          </div>
        </Modal>
      )}

      {/* Show Newly Created Key Modal */}
      {newlyCreatedKey && (
        <Modal 
          title="Node Provisioned" 
          onClose={() => setNewlyCreatedKey(null)}
          maxWidth="max-w-md"
        >
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
              <Check className="text-emerald-500" size={24} strokeWidth={3} />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Node identity successfully created.</p>
            </div>
            <div className="p-6 bg-zinc-900 rounded-xl space-y-3 relative group">
              <p className="text-[0.65rem] font-black uppercase tracking-widest text-zinc-500">Secret API Key</p>
              <div className="flex items-center gap-3">
                <code className="text-blue-400 font-mono font-bold break-all flex-1">{newlyCreatedKey.key}</code>
                <button 
                  onClick={() => copyToClipboard(newlyCreatedKey.key || '')}
                  className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-all"
                >
                  {copiedKey ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
               <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                 <span className="uppercase block mb-1">Warning:</span>
                 This key will NEVER be shown again. Secure it immediately.
               </p>
            </div>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="w-full h-14 bg-zinc-100 dark:bg-slate-800 text-olive-950 dark:text-white rounded-xl font-bold"
            >
              I have stored the key securely
            </button>
          </div>
        </Modal>
      )}

      {/* Event Logs Modal */}
      {selectedEvent && (
        <Modal 
          title={`Signals: ${selectedEvent.eventName}`} 
          onClose={() => setSelectedEvent(null)}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {selectedEventLogs.map(log => (
              <div key={log._id} className="bg-zinc-50 dark:bg-slate-800 rounded-xl border border-zinc-100 dark:border-slate-700 overflow-hidden">
                <div className="px-4 py-3 bg-zinc-100/50 dark:bg-slate-800/50 flex items-center justify-between border-b border-zinc-100 dark:border-slate-700">
                   <div className="flex items-center gap-3">
                      <Clock size={14} className="text-zinc-400" />
                      <span className="text-[0.8rem] font-bold text-zinc-500">{new Date(log.createdAt).toLocaleString()}</span>
                   </div>
                   {log.userIdentifier && (
                     <div className="flex items-center gap-2 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md text-[0.7rem] font-black uppercase tracking-widest">
                       <User size={10} />
                       {log.userIdentifier}
                     </div>
                   )}
                </div>
                <div className="p-4">
                  <pre className="text-[0.85rem] font-mono text-blue-600 dark:text-blue-400 overflow-x-auto">
                    <code>{JSON.stringify(log.payload, null, 2)}</code>
                  </pre>
                </div>
              </div>
            ))}
            {selectedEventLogs.length === 0 && (
              <div className="py-20 text-center text-zinc-400 italic">No signals recorded yet.</div>
            )}
          </div>
        </Modal>
      )}

      {/* User History Modal */}
      {selectedUser && (
        <Modal 
          title={`Identity Timeline: ${selectedUser.userIdentifier}`} 
          onClose={() => setSelectedUser(null)}
          maxWidth="max-w-4xl"
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar text-olive-950 dark:text-slate-100">
            <div className="p-6 bg-zinc-50 dark:bg-slate-800 rounded-2xl flex items-start gap-4">
               <div className="p-3 bg-emerald-500 text-white rounded-xl">
                 <User size={24} />
               </div>
               <div>
                 <h4 className="text-lg font-bold">User Metadata</h4>
                 <pre className="mt-3 text-xs font-mono text-zinc-500 bg-white dark:bg-slate-900 p-3 rounded-lg border border-zinc-100 dark:border-slate-800">
                   {JSON.stringify(selectedUser.metadata, null, 2)}
                 </pre>
               </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-black uppercase tracking-widest text-zinc-500 pt-4">User Event History</h4>
              {selectedUserEvents.map(log => (
                <div key={log._id} className="relative pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-zinc-100 dark:before:bg-slate-800">
                  <div className="absolute left-1.5 top-2 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                  <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-sm font-black text-olive-950 dark:text-slate-100 uppercase tracking-wider">{(log as any).eventName}</span>
                       <span className="text-[0.7rem] text-zinc-400 font-bold">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <pre className="text-[0.75rem] font-mono text-zinc-500 bg-zinc-50 dark:bg-slate-800/50 p-2 rounded">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default EventTrackingPage;
