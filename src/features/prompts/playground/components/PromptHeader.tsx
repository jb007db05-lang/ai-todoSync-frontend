import React from "react";
import { FileText, Save, Code2, FolderInput, Rocket, CheckCircle2, SlidersHorizontal, Zap } from "lucide-react";
import { PromptItem, PromptCanaryDeployment } from "@/services/prompts";

interface PromptHeaderProps {
  activePrompt: PromptItem | null;
  selectedVersionNum: number;
  hasVersionedConfigurationChanged: boolean;
  isSaving: boolean;
  isEditingPromptContent: boolean;
  isPublishingProduction?: boolean;
  activeCanary?: PromptCanaryDeployment | null;
  onSavePrompt: () => void;
  onToggleEditStructure: () => void;
  onOpenMoveModal: () => void;
  onPublishProduction?: (versionNum: number) => void;
  onOpenDeployModal?: () => void;
  onOpenParametersModal?: () => void;
}

export const PromptHeader: React.FC<PromptHeaderProps> = ({
  activePrompt,
  selectedVersionNum,
  hasVersionedConfigurationChanged,
  isSaving,
  isEditingPromptContent,
  isPublishingProduction = false,
  activeCanary,
  onSavePrompt,
  onToggleEditStructure,
  onOpenMoveModal,
  onPublishProduction,
  onOpenDeployModal,
  onOpenParametersModal,
}) => {
  const isCurrentProduction = activePrompt?.productionVersion === selectedVersionNum && selectedVersionNum > 0;
  const isCanaryCandidate =
    activeCanary &&
    ["active", "paused"].includes(activeCanary.status) &&
    activeCanary.candidateVersion === selectedVersionNum;

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs w-full">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gray-100 text-gray-700 shrink-0 mt-0.5">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-gray-900">
              {activePrompt?.name || "New Prompt"}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-100 text-gray-700 border border-gray-200">
              {selectedVersionNum > 0 ? `v${selectedVersionNum}` : "No saved version yet"}
            </span>

            {/* Canary Candidate Badge */}
            {isCanaryCandidate && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-purple-600" /> Canary Candidate ({activeCanary.trafficWeight?.canary ?? 5}%)
              </span>
            )}

            {/* Production Badge */}
            {activePrompt?.productionVersion ? (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 border ${
                  isCurrentProduction
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-blue-50 text-blue-700 border-blue-200"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" /> Prod v{activePrompt.productionVersion}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-400 border border-gray-200">
                Not Published
              </span>
            )}

            {hasVersionedConfigurationChanged ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                Unsaved changes
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                Saved
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 font-normal">
            Provider: <span className="font-mono text-gray-700 font-medium">{activePrompt?.provider || "gemini"}</span> • Model:{" "}
            <span className="font-mono text-gray-700 font-medium">{activePrompt?.modelName || "gemini-3.6-flash"}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
        <button
          type="button"
          onClick={onSavePrompt}
          disabled={isSaving || (!hasVersionedConfigurationChanged && selectedVersionNum > 0)}
          className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition flex items-center gap-1.5 cursor-pointer ${
            hasVersionedConfigurationChanged || selectedVersionNum === 0
              ? "bg-olive-700 hover:bg-olive-800 text-white shadow-2xs"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? "Saving..." : "Save"}
        </button>

        {onOpenDeployModal && selectedVersionNum > 0 ? (
          <button
            type="button"
            onClick={onOpenDeployModal}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Rocket className="w-3.5 h-3.5" /> Deploy...
          </button>
        ) : onPublishProduction && selectedVersionNum > 0 ? (
          <button
            type="button"
            onClick={() => onPublishProduction(selectedVersionNum)}
            disabled={isPublishingProduction || isCurrentProduction}
            className={`px-3.5 py-1.5 rounded-lg font-medium text-xs transition flex items-center gap-1.5 cursor-pointer border ${
              isCurrentProduction
                ? "bg-emerald-50 border-emerald-300 text-emerald-700 cursor-default"
                : "bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white shadow-2xs"
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            {isPublishingProduction
              ? "Publishing..."
              : isCurrentProduction
              ? "Production Active"
              : "Publish to Prod"}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onOpenMoveModal}
          disabled={!activePrompt}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <FolderInput className="w-3.5 h-3.5 text-gray-500" />
          Move
        </button>

        <button
          type="button"
          onClick={onToggleEditStructure}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5 text-gray-500" />
          {isEditingPromptContent ? "Done Editing" : "Edit Structure"}
        </button>

        {onOpenParametersModal && (
          <button
            type="button"
            onClick={onOpenParametersModal}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500" />
            Parameters
          </button>
        )}
      </div>
    </div>
  );
};
