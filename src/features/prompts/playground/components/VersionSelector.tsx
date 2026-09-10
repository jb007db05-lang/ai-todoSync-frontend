import React from "react";
import { GitBranch, Clock } from "lucide-react";
import { PromptVersion } from "@/services/prompts";

interface VersionSelectorProps {
  versionsList: PromptVersion[];
  selectedVersionNum: number;
  onSelectVersion: (versionNum: number) => void;
  onOpenCompare: () => void;
}

export const VersionSelector: React.FC<VersionSelectorProps> = ({
  versionsList,
  selectedVersionNum,
  onSelectVersion,
  onOpenCompare,
}) => {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-gray-500" /> Version History
        </h3>
        <button
          type="button"
          onClick={onOpenCompare}
          className="px-3 py-1 rounded-lg bg-olive-50 hover:bg-olive-100 text-olive-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-olive-200"
        >
          <GitBranch className="w-3.5 h-3.5" /> Compare Versions
        </button>
      </div>

      <div className="space-y-2">
        {versionsList.map((ver) => {
          const isSelected = selectedVersionNum === ver.version;
          const noteText = ver.changeNote || (ver as unknown as Record<string, string>).changelog;
          return (
            <div
              key={ver._id}
              onClick={() => onSelectVersion(ver.version)}
              className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                isSelected
                  ? "bg-olive-50 border-olive-400 font-bold text-olive-950"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span>v{ver.version}</span>
                  {noteText && (
                    <span className="text-[10px] text-gray-500 font-normal">
                      • {noteText}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-normal flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ver.createdAt ? new Date(ver.createdAt).toLocaleString() : "Recently"}
                </div>
              </div>
              {isSelected && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-olive-700 text-white">
                  Active
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
