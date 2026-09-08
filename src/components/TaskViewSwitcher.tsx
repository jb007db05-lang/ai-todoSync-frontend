import React from "react";
import { LayoutGrid, List, Calendar as CalendarIcon, GitCommitHorizontal } from "lucide-react";

export type TaskViewType = "kanban" | "list" | "calendar" | "timeline";

interface TaskViewSwitcherProps {
  currentView: TaskViewType;
  onViewChange: (view: TaskViewType) => void;
}

export const TaskViewSwitcher: React.FC<TaskViewSwitcherProps> = ({
  currentView,
  onViewChange,
}) => {
  const views: Array<{ id: TaskViewType; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: "kanban", label: "Board", icon: LayoutGrid },
    { id: "list", label: "List", icon: List },
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "timeline", label: "Timeline", icon: GitCommitHorizontal },
  ];

  return (
    <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 space-x-1">
      {views.map((v) => {
        const Icon = v.icon;
        const isActive = currentView === v.id;
        return (
          <button
            key={v.id}
            onClick={() => onViewChange(v.id)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isActive
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span>{v.label}</span>
          </button>
        );
      })}
    </div>
  );
};
