import React from "react";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { PromptItem } from "@/services/prompts";
import { PromptCard } from "./PromptCard";

interface PromptGridProps {
  prompts: PromptItem[];
  isLoading: boolean;
  searchQuery: string;
  showFavoritesOnly: boolean;
  folderMap: Map<string, string>;
  activeMenuPromptId: string | null;
  isCreatingPrompt: boolean;
  onClearFilters: () => void;
  onNewPrompt: () => void;
  onOpenPlayground: (promptId: string, version: number) => void;
  onToggleFavorite: (promptId: string, e: React.MouseEvent) => void;
  onToggleMenu: (promptId: string, e: React.MouseEvent) => void;
  onCloseMenu: () => void;
  onOpenCompare: (prompt: PromptItem) => void;
  onOpenMoveModal: (prompt: PromptItem, e: React.MouseEvent) => void;
  onOpenDeleteModal: (prompt: PromptItem, e: React.MouseEvent) => void;
  formatTimeAgo: (dateString?: string) => string;
}

export const PromptGrid: React.FC<PromptGridProps> = ({
  prompts,
  isLoading,
  searchQuery,
  showFavoritesOnly,
  folderMap,
  activeMenuPromptId,
  isCreatingPrompt,
  onClearFilters,
  onNewPrompt,
  onOpenPlayground,
  onToggleFavorite,
  onToggleMenu,
  onCloseMenu,
  onOpenCompare,
  onOpenMoveModal,
  onOpenDeleteModal,
  formatTimeAgo,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="p-5 rounded-2xl bg-white border border-olive-200 animate-pulse space-y-4 shadow-2xs">
            <div className="h-4 bg-olive-100 rounded-md w-3/4" />
            <div className="h-3 bg-olive-100 rounded-md w-1/2" />
            <div className="h-16 bg-olive-50 rounded-xl" />
            <div className="h-3 bg-olive-100 rounded-md w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white border border-olive-200 shadow-2xs space-y-4">
        <div className="p-4 w-14 h-14 rounded-2xl bg-olive-100 text-olive-800 border border-olive-200 mx-auto flex items-center justify-center">
          <Sparkles className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-olive-950">No prompts found</h3>
          <p className="text-xs text-olive-600 max-w-sm mx-auto">
            {searchQuery || showFavoritesOnly
              ? "No prompts match your current filter parameters. Try clearing your search filters."
              : "Create your first prompt to start building and testing reusable prompts."}
          </p>
        </div>
        {searchQuery || showFavoritesOnly ? (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 rounded-xl bg-olive-100 hover:bg-olive-200 border border-olive-300 text-olive-900 text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
          >
            Clear Filters
          </button>
        ) : (
          <button
            onClick={onNewPrompt}
            disabled={isCreatingPrompt}
            className="px-4 py-2 rounded-xl bg-olive-900 text-white text-xs font-semibold shadow-md shadow-olive-900/20 hover:bg-black transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isCreatingPrompt ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> New Prompt
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {prompts.map((p) => (
        <PromptCard
          key={p._id}
          prompt={p}
          folderName={p.folderId ? folderMap.get(p.folderId) || null : null}
          isMenuOpen={activeMenuPromptId === p._id}
          onOpenPlayground={onOpenPlayground}
          onToggleFavorite={onToggleFavorite}
          onToggleMenu={onToggleMenu}
          onCloseMenu={onCloseMenu}
          onOpenCompare={onOpenCompare}
          onOpenMoveModal={onOpenMoveModal}
          onOpenDeleteModal={onOpenDeleteModal}
          formatTimeAgo={formatTimeAgo}
        />
      ))}
    </div>
  );
};
