import React from "react";
import {
  Sparkles,
  Plus,
  FolderPlus,
  Folder as FolderIcon,
  ArrowLeft,
  X,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { PromptItem, PromptFolder } from "@/services/prompts";
import { PromptLibraryToolbar } from "./PromptLibraryToolbar";
import { PromptGrid } from "./PromptGrid";
import { PromptFolderGrid } from "./PromptFolderGrid";
import { PromptMoveModal } from "./PromptMoveModal";
import { PromptVersionCompareModal } from "@/components/PromptVersionCompareModal";

interface PromptLibraryLayoutProps {
  workspaceId: string;
  activeView: "prompts" | "folders";
  setActiveView: (view: "prompts" | "folders") => void;
  prompts: PromptItem[];
  folders: PromptFolder[];
  isLoading: boolean;
  isCreatingPrompt: boolean;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (fav: boolean) => void;
  newFolderName: string;
  setNewFolderName: (name: string) => void;
  isCreatingFolder: boolean;
  setIsCreatingFolder: (creating: boolean) => void;
  activeMenuPromptId: string | null;
  setActiveMenuPromptId: (id: string | null) => void;
  moveModalPrompt: PromptItem | null;
  setMoveModalPrompt: (prompt: PromptItem | null) => void;
  targetFolderId: string | null;
  setTargetFolderId: (id: string | null) => void;
  isMoving: boolean;
  deleteModalPrompt: PromptItem | null;
  setDeleteModalPrompt: (prompt: PromptItem | null) => void;
  isDeleting: boolean;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  successMessage: string | null;
  setSuccessMessage: (msg: string | null) => void;
  displayedPrompts: PromptItem[];
  folderMap: Map<string, string>;
  folderPromptCounts: Map<string, number>;
  onNewPrompt: (onCreated: (promptId: string, version: number) => void) => void;
  onCreateFolder: () => void;
  onDeleteFolder: (folderId: string, e: React.MouseEvent) => void;
  onToggleFavorite: (promptId: string, e: React.MouseEvent) => void;
  onConfirmMove: () => Promise<void>;
  onConfirmDelete: () => Promise<void>;
  onOpenPlayground: (promptId: string, version: number) => void;
  comparePrompt: PromptItem | null;
  setComparePrompt: (prompt: PromptItem | null) => void;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
}

export const PromptLibraryLayout: React.FC<PromptLibraryLayoutProps> = ({
  workspaceId,
  activeView,
  setActiveView,
  prompts,
  folders,
  isLoading,
  isCreatingPrompt,
  selectedFolderId,
  setSelectedFolderId,
  searchQuery,
  setSearchQuery,
  showFavoritesOnly,
  setShowFavoritesOnly,
  newFolderName,
  setNewFolderName,
  isCreatingFolder,
  setIsCreatingFolder,
  activeMenuPromptId,
  setActiveMenuPromptId,
  moveModalPrompt,
  setMoveModalPrompt,
  targetFolderId,
  setTargetFolderId,
  isMoving,
  deleteModalPrompt,
  setDeleteModalPrompt,
  isDeleting,
  errorMessage,
  setErrorMessage,
  successMessage,
  setSuccessMessage,
  displayedPrompts,
  folderMap,
  folderPromptCounts,
  onNewPrompt,
  onCreateFolder,
  onDeleteFolder,
  onToggleFavorite,
  onConfirmMove,
  onConfirmDelete,
  onOpenPlayground,
  comparePrompt,
  setComparePrompt,
  isCompareOpen,
  setIsCompareOpen,
}) => {
  const currentFolder = React.useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find((f) => f._id === selectedFolderId) || null;
  }, [selectedFolderId, folders]);

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-full bg-olive-50 text-olive-950 p-6 space-y-6 font-sans">
      <div className="bg-white border border-olive-200 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-olive-900 text-white shadow-md shadow-olive-900/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-olive-950 flex items-center gap-2.5">
              Prompt Library
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-olive-100 text-olive-800 border border-olive-200 font-mono">
                PromptOps v1.0
              </span>
            </h1>
            <p className="text-xs text-olive-600 mt-0.5">
              Browse reusable prompt templates, organization folders, and versions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setActiveView("folders");
              setIsCreatingFolder(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-olive-50 border border-olive-200 text-olive-700 hover:text-olive-950 text-xs font-semibold flex items-center gap-2 transition shadow-2xs cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-olive-600" /> New Folder
          </button>

          <button
            onClick={() => onNewPrompt(onOpenPlayground)}
            disabled={isCreatingPrompt}
            className="px-4 py-2 rounded-xl bg-olive-900 hover:bg-black text-white text-xs font-semibold shadow-md shadow-olive-900/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-800 font-bold">
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      <PromptLibraryToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeView={activeView}
        setActiveView={setActiveView}
        setSelectedFolderId={setSelectedFolderId}
        promptsCount={prompts.length}
        foldersCount={folders.length}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
      />

      {activeView === "prompts" ? (
        <PromptGrid
          prompts={displayedPrompts}
          isLoading={isLoading}
          searchQuery={searchQuery}
          showFavoritesOnly={showFavoritesOnly}
          folderMap={folderMap}
          activeMenuPromptId={activeMenuPromptId}
          isCreatingPrompt={isCreatingPrompt}
          onClearFilters={() => {
            setSearchQuery("");
            setShowFavoritesOnly(false);
          }}
          onNewPrompt={() => onNewPrompt(onOpenPlayground)}
          onOpenPlayground={onOpenPlayground}
          onToggleFavorite={onToggleFavorite}
          onToggleMenu={(id, e) => {
            e.stopPropagation();
            setActiveMenuPromptId(activeMenuPromptId === id ? null : id);
          }}
          onCloseMenu={() => setActiveMenuPromptId(null)}
          onOpenCompare={(prompt) => {
            setComparePrompt(prompt);
            setIsCompareOpen(true);
          }}
          onOpenMoveModal={(prompt, e) => {
            e.stopPropagation();
            setActiveMenuPromptId(null);
            setMoveModalPrompt(prompt);
            setTargetFolderId(prompt.folderId || null);
          }}
          onOpenDeleteModal={(prompt, e) => {
            e.stopPropagation();
            setActiveMenuPromptId(null);
            setDeleteModalPrompt(prompt);
          }}
          formatTimeAgo={formatTimeAgo}
        />
      ) : (
        <div className="space-y-5">
          <div className="bg-white border border-olive-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {selectedFolderId !== null ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className="px-3 py-1.5 rounded-xl bg-olive-100 hover:bg-olive-200 text-olive-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-olive-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Folders
                </button>
                <div className="h-5 w-px bg-olive-200" />
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-5 h-5 text-olive-800" />
                  <h2 className="text-base font-bold text-olive-950">
                    {currentFolder?.name || "Folder"}
                  </h2>
                  <span className="text-xs text-olive-500 font-mono px-2 py-0.5 rounded-full bg-olive-100 border border-olive-200">
                    {displayedPrompts.length} prompts
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FolderIcon className="w-5 h-5 text-olive-800" />
                <h2 className="text-base font-bold text-olive-950">All Folders ({folders.length})</h2>
              </div>
            )}

            {isCreatingFolder ? (
              <div className="flex items-center gap-2 bg-olive-50 border border-olive-200 p-1.5 rounded-xl">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New folder name..."
                  className="bg-white border border-olive-200 rounded-lg px-2.5 py-1 text-xs text-olive-950 focus:outline-none focus:border-olive-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onCreateFolder();
                    if (e.key === "Escape") setIsCreatingFolder(false);
                  }}
                />
                <button
                  onClick={onCreateFolder}
                  className="px-2.5 py-1 text-xs bg-olive-900 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsCreatingFolder(false)}
                  className="p-1 text-olive-500 hover:text-olive-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="px-3.5 py-1.5 rounded-xl bg-olive-100 hover:bg-olive-200 text-olive-900 text-xs font-bold flex items-center gap-2 transition cursor-pointer border border-olive-300"
              >
                <FolderPlus className="w-4 h-4" /> Add Folder
              </button>
            )}
          </div>

          {selectedFolderId !== null ? (
            <PromptGrid
              prompts={displayedPrompts}
              isLoading={isLoading}
              searchQuery={searchQuery}
              showFavoritesOnly={showFavoritesOnly}
              folderMap={folderMap}
              activeMenuPromptId={activeMenuPromptId}
              isCreatingPrompt={isCreatingPrompt}
              onClearFilters={() => {
                setSearchQuery("");
                setShowFavoritesOnly(false);
              }}
              onNewPrompt={() => onNewPrompt(onOpenPlayground)}
              onOpenPlayground={onOpenPlayground}
              onToggleFavorite={onToggleFavorite}
              onToggleMenu={(id, e) => {
                e.stopPropagation();
                setActiveMenuPromptId(activeMenuPromptId === id ? null : id);
              }}
              onCloseMenu={() => setActiveMenuPromptId(null)}
              onOpenCompare={(prompt) => {
                setComparePrompt(prompt);
                setIsCompareOpen(true);
              }}
              onOpenMoveModal={(prompt, e) => {
                e.stopPropagation();
                setActiveMenuPromptId(null);
                setMoveModalPrompt(prompt);
                setTargetFolderId(prompt.folderId || null);
              }}
              onOpenDeleteModal={(prompt, e) => {
                e.stopPropagation();
                setActiveMenuPromptId(null);
                setDeleteModalPrompt(prompt);
              }}
              formatTimeAgo={formatTimeAgo}
            />
          ) : (
            <PromptFolderGrid
              folders={folders}
              isLoading={isLoading}
              folderPromptCounts={folderPromptCounts}
              onSelectFolder={(id) => setSelectedFolderId(id)}
              onDeleteFolder={onDeleteFolder}
              onCreateFolderClick={() => setIsCreatingFolder(true)}
            />
          )}
        </div>
      )}

      {comparePrompt && (
        <PromptVersionCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          workspaceId={workspaceId}
          prompt={comparePrompt}
          onOpenPlayground={(p, ver) => {
            onOpenPlayground(p._id, ver || p.version);
          }}
        />
      )}

      {moveModalPrompt && (
        <PromptMoveModal
          prompt={moveModalPrompt}
          folders={folders}
          folderPromptCounts={folderPromptCounts}
          targetFolderId={targetFolderId}
          setTargetFolderId={setTargetFolderId}
          isMoving={isMoving}
          onClose={() => setMoveModalPrompt(null)}
          onConfirmMove={onConfirmMove}
        />
      )}

      {deleteModalPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 space-y-3">
              <h3 className="text-base font-bold text-gray-900">Delete prompt?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-gray-900">"{deleteModalPrompt.name}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalPrompt(null)}
                className="px-4 py-1.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={onConfirmDelete}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
