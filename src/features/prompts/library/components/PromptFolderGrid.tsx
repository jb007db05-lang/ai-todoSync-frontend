import React from "react";
import { Folder as FolderIcon, Trash2, FolderPlus } from "lucide-react";
import { PromptFolder } from "@/services/prompts";

interface PromptFolderGridProps {
  folders: PromptFolder[];
  isLoading: boolean;
  folderPromptCounts: Map<string, number>;
  onSelectFolder: (folderId: string) => void;
  onDeleteFolder: (folderId: string, e: React.MouseEvent) => void;
  onCreateFolderClick: () => void;
}

export const PromptFolderGrid: React.FC<PromptFolderGridProps> = ({
  folders,
  isLoading,
  folderPromptCounts,
  onSelectFolder,
  onDeleteFolder,
  onCreateFolderClick,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((n) => (
          <div key={n} className="p-5 rounded-2xl bg-white border border-olive-200 animate-pulse space-y-3 shadow-2xs">
            <div className="h-5 bg-olive-100 rounded-md w-1/2" />
            <div className="h-3 bg-olive-100 rounded-md w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white border border-olive-200 shadow-2xs space-y-4">
        <div className="p-4 w-14 h-14 rounded-2xl bg-olive-100 text-olive-800 border border-olive-200 mx-auto flex items-center justify-center">
          <FolderIcon className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-olive-950">No folders yet</h3>
          <p className="text-xs text-olive-600 max-w-sm mx-auto">
            Create a folder to organize your prompts into logical groups.
          </p>
        </div>
        <button
          onClick={onCreateFolderClick}
          className="px-4 py-2 rounded-xl bg-olive-900 text-white text-xs font-semibold shadow-md shadow-olive-900/20 hover:bg-black transition inline-flex items-center gap-2 cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" /> Create Folder
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {folders.map((f) => {
        const count = folderPromptCounts.get(f._id) || 0;
        return (
          <div
            key={f._id}
            onClick={() => onSelectFolder(f._id)}
            className="p-5 rounded-2xl bg-white border border-olive-200 hover:border-olive-400 transition-all shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between group space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-olive-100 text-olive-800 border border-olive-200 group-hover:bg-olive-900 group-hover:text-white transition">
                  <FolderIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-olive-950 group-hover:text-olive-700 transition">
                    {f.name}
                  </h3>
                  {f.description && (
                    <p className="text-xs text-olive-600 line-clamp-1 mt-0.5">
                      {f.description}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => onDeleteFolder(f._id, e)}
                className="p-1.5 rounded-lg text-olive-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Delete folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-olive-100 pt-3 text-xs text-olive-500">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-olive-100 text-olive-800 border border-olive-200 font-mono">
                {count} {count === 1 ? "prompt" : "prompts"}
              </span>
              <span className="text-xs font-bold text-olive-900 group-hover:text-emerald-700 transition">
                View Folder →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
