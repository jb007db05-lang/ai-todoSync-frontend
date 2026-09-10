import React from "react";
import { FileText, Save, Code2, FolderInput } from "lucide-react";
import { PromptItem } from "@/services/prompts";

interface PromptHeaderProps {
  activePrompt: PromptItem | null;
  selectedVersionNum: number;
  hasVersionedConfigurationChanged: boolean;
  isSaving: boolean;
  isEditingPromptContent: boolean;
  onSavePrompt: () => void;
  onToggleEditStructure: () => void;
  onOpenMoveModal: () => void;
}

export const PromptHeader: React.FC<PromptHeaderProps> = ({
  activePrompt,
  selectedVersionNum,
  hasVersionedConfigurationChanged,
  isSaving,
  isEditingPromptContent,
  onSavePrompt,
  onToggleEditStructure,
  onOpenMoveModal,
}) => {
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs w-full">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gray-100 text-gray-700 shrink-0 mt-0.5">
          <FileText className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">
              {activePrompt?.name || "New Prompt"}
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200">
              {selectedVersionNum > 0 ? `v${selectedVersionNum}` : "No saved version yet"}
            </span>
            {hasVersionedConfigurationChanged ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                Unsaved changes
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Saved
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Created from Prompt Library • Last updated just now
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={onSavePrompt}
          disabled={isSaving || (!hasVersionedConfigurationChanged && selectedVersionNum > 0)}
          className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
            hasVersionedConfigurationChanged || selectedVersionNum === 0
              ? "bg-olive-700 hover:bg-olive-800 text-white shadow-2xs"
              : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={onOpenMoveModal}
          disabled={!activePrompt}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <FolderInput className="w-3.5 h-3.5 text-gray-500" />
          Move to Folder
        </button>

        <button
          type="button"
          onClick={onToggleEditStructure}
          className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5 text-gray-500" />
          {isEditingPromptContent ? "Done Editing" : "Edit Structure"}
        </button>
      </div>
    </div>
  );
};
