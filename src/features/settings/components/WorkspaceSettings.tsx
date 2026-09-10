import React from "react";
import SectionCard from "@/components/SectionCard";
import { Shield } from "lucide-react";

interface WorkspaceSettingsProps {
  currentWorkspace?: { name?: string; id?: string } | null;
}

export const WorkspaceSettings: React.FC<WorkspaceSettingsProps> = ({ currentWorkspace }) => {
  return (
    <SectionCard>
      <h3 className="text-sm font-bold text-olive-950 mb-1">Workspace Profile & Preferences</h3>
      <p className="text-xs text-olive-600 mb-4">Manage organization settings, default policies, and security limits.</p>
      <div className="space-y-4 text-xs font-sans">
        <div className="p-4 rounded border border-olive-200 bg-olive-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-olive-950 text-sm">
              {currentWorkspace?.name || "Active Workspace"}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-olive-200 text-olive-900 border border-olive-300">
              Active Workspace
            </span>
          </div>
          <p className="text-olive-600 font-mono text-[11px]">ID: {currentWorkspace?.id || "N/A"}</p>
        </div>

        <div className="pt-2 border-t border-olive-200 space-y-2">
          <h5 className="font-bold text-olive-900 flex items-center gap-1.5 text-xs">
            <Shield className="w-4 h-4 text-olive-700" /> Workspace Security & Governance
          </h5>
          <p className="text-olive-700 leading-relaxed text-xs">
            All team members assigned to this workspace inherit configured SLA response targets, security constraints, and project visibility controls.
          </p>
        </div>
      </div>
    </SectionCard>
  );
};
