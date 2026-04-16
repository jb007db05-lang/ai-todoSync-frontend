import { useState, useEffect, useCallback } from 'react';
import {
  History,
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getProjectActivities, type ActivityLog } from '@/services/activity';

interface ActivityHistoryPanelProps {
  projectId: string;
  projectName: string;
}

const ENTITY_LABELS: Record<string, string> = {
  project: 'Project',
  epic: 'Epic',
  task: 'Task',
  subtask: 'Subtask',
  note: 'Note',
};

const ENTITY_COLORS: Record<string, string> = {
  project: 'bg-blue-500',
  epic: 'bg-purple-500',
  task: 'bg-olive-600',
  subtask: 'bg-teal-500',
  note: 'bg-amber-500',
};

const ACTION_ICONS: Record<string, typeof Plus> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  assigned: UserPlus,
  status_changed: ArrowRightLeft,
  member_added: UserPlus,
  member_removed: UserMinus,
};

const ACTION_COLORS: Record<string, string> = {
  created: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  updated: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20',
  deleted: 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
  assigned: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20',
  status_changed: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
  member_added: 'text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/20',
  member_removed: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20',
};

const FILTER_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'project', label: 'Project' },
  { value: 'epic', label: 'Epics' },
  { value: 'task', label: 'Tasks' },
  { value: 'subtask', label: 'Subtasks' },
  { value: 'note', label: 'Notes' },
];

function getDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (msgDate.getTime() === today.getTime()) return 'Today';
  if (msgDate.getTime() === yesterday.getTime()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityHistoryPanel({
  projectId,
  projectName,
}: ActivityHistoryPanelProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProjectActivities(projectId, {
        page,
        limit: 30,
        entityType: entityFilter || undefined,
      });
      setActivities(result.activities);
      setTotalPages(result.totalPages);
    } catch (err) {
      console.error('Failed to load activities', err);
    }
    setLoading(false);
  }, [projectId, page, entityFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Group activities by date
  const groupedActivities: { label: string; items: ActivityLog[] }[] = [];
  let currentLabel = '';
  for (const activity of activities) {
    const label = getDateLabel(activity.createdAt);
    if (label !== currentLabel) {
      groupedActivities.push({ label, items: [] });
      currentLabel = label;
    }
    groupedActivities[groupedActivities.length - 1].items.push(activity);
  }

  return (
    <div className="flex flex-col h-full max-h-[75vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-olive-50 dark:bg-olive-900/30 rounded-xl">
            <History className="w-5 h-5 text-olive-600 dark:text-olive-400" />
          </div>
          <div>
            <h3 className="text-[0.95rem] font-bold text-slate-900 dark:text-white">
              Activity History
            </h3>
            <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 font-medium">
              {projectName}
            </p>
          </div>
        </div>

        {/* Entity type filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-olive-500/30"
          >
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
            <History className="w-12 h-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">No activity yet</p>
            <p className="text-xs mt-1">Changes to this project will appear here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedActivities.map((group) => (
              <div key={group.label}>
                {/* Date separator */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
                  <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 select-none whitespace-nowrap">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
                </div>

                {/* Activity items */}
                <div className="space-y-1">
                  {group.items.map((activity) => {
                    const IconComponent = ACTION_ICONS[activity.action] || Pencil;
                    const colorClass = ACTION_COLORS[activity.action] || ACTION_COLORS.updated;
                    const entityColor = ENTITY_COLORS[activity.entityType] || 'bg-slate-500';

                    return (
                      <div
                        key={activity.id}
                        className="group flex items-start gap-3.5 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200"
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${colorClass} transition-transform group-hover:scale-105`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[0.82rem] font-bold text-slate-800 dark:text-slate-200">
                              {activity.userName}
                            </span>
                            <span className="text-[0.78rem] text-slate-500 dark:text-slate-400">
                              {activity.description}
                            </span>
                          </div>

                          {/* Entity badge + timestamp */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[0.62rem] font-black uppercase tracking-wider text-white ${entityColor}`}>
                              {ENTITY_LABELS[activity.entityType]}
                            </span>
                            {activity.entityName && (
                              <span className="text-[0.72rem] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                {activity.entityName}
                              </span>
                            )}
                            <span className="text-[0.62rem] text-slate-400 dark:text-slate-500 ml-auto whitespace-nowrap">
                              {formatTime(activity.createdAt)}
                            </span>
                          </div>

                          {/* Field changes */}
                          {activity.changes.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {activity.changes.slice(0, 3).map((change, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 text-[0.7rem] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-1.5"
                                >
                                  <span className="font-bold text-slate-600 dark:text-slate-300 capitalize">
                                    {change.field}:
                                  </span>
                                  {change.oldValue && (
                                    <span className="line-through text-red-400 truncate max-w-[120px]">
                                      {change.oldValue}
                                    </span>
                                  )}
                                  {change.oldValue && change.newValue && (
                                    <span className="text-slate-300 dark:text-slate-600">→</span>
                                  )}
                                  {change.newValue && (
                                    <span className="text-green-600 dark:text-green-400 truncate max-w-[120px]">
                                      {change.newValue}
                                    </span>
                                  )}
                                </div>
                              ))}
                              {activity.changes.length > 3 && (
                                <span className="text-[0.65rem] text-slate-400 italic pl-3">
                                  +{activity.changes.length - 3} more changes
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous
          </button>
          <span className="text-[0.7rem] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40 transition-colors"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
