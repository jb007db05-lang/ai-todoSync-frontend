import React from "react";
import { Folder as FolderIcon, X, Loader2, ChevronDown } from "lucide-react";
import { PromptItem, PromptFolder } from "@/services/prompts";

interface PromptMoveModalProps {
  prompt: PromptItem;
  folders: PromptFolder[];
  folderPromptCounts: Map<string, number>;
  targetFolderId: string | null;
  setTargetFolderId: (id: string | null) => void;
  isMoving: boolean;
  onClose: () => void;
  onConfirmMove: () => Promise<void>;
}

export const PromptMoveModal: React.FC<PromptMoveModalProps> = ({
  prompt,
  folders,
  folderPromptCounts,
  targetFolderId,
  setTargetFolderId,
  isMoving,
  onClose,
  onConfirmMove,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">
            Move "{prompt.name}" to...
          </h3>
          <button
            type="button"
            onClick={() => !isMoving && onClose()}
            className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-700">
              Select Folder
            </label>
            <div className="relative">
              <select
                value={targetFolderId || ""}
                onChange={(e) => setTargetFolderId(e.target.value || null)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-500/20 cursor-pointer appearance-none pr-8"
              >
                <option value="">Uncategorized / No Folder</option>
                {folders.map((f) => {
                  const count = folderPromptCounts.get(f._id) || 0;
                  return (
                    <option key={f._id} value={f._id}>
                      {f.name} ({count})
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar text-xs pt-1">
            <label
              onClick={() => setTargetFolderId(null)}
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                targetFolderId === null
                  ? "bg-olive-50 border-olive-400 font-bold text-olive-900 shadow-2xs"
                  : "border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderIcon className={`w-4 h-4 ${targetFolderId === null ? "text-olive-700" : "text-gray-400"}`} />
                <span>Uncategorized / No Folder</span>
              </div>
              <input
                type="radio"
                name="targetFolderModal"
                checked={targetFolderId === null}
                onChange={() => setTargetFolderId(null)}
                className="accent-olive-700 cursor-pointer"
              />
            </label>

            {folders.map((f) => {
              const isSelected = targetFolderId === f._id;
              const count = folderPromptCounts.get(f._id) || 0;
              return (
                <label
                  key={f._id}
                  onClick={() => setTargetFolderId(f._id)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? "bg-olive-50 border-olive-400 font-bold text-olive-900 shadow-2xs"
                      : "border-gray-200 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FolderIcon className={`w-4 h-4 ${isSelected ? "text-olive-700" : "text-gray-400"}`} />
                    <span>{f.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">({count})</span>
                  </div>
                  <input
                    type="radio"
                    name="targetFolderModal"
                    checked={isSelected}
                    onChange={() => setTargetFolderId(f._id)}
                    className="accent-olive-700 cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
          <button
            type="button"
            disabled={isMoving}
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isMoving}
            onClick={onConfirmMove}
            className="px-4 py-1.5 rounded-xl bg-olive-900 hover:bg-black text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isMoving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Moving...
              </>
            ) : (
              "Move"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
