import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  FolderPlus,
  Search,
  Folder as FolderIcon,
  Tag,
  Star,
  GitBranch,
  Layers,
  Code,
  FileCode,
  Trash2,
  Edit,
  Filter,
  CheckCircle,
} from "lucide-react";
import {
  promptService,
  PromptItem,
  PromptFolder,
} from "@/services/prompts";
import { PromptEditorModal } from "@/components/PromptEditorModal";
import { PromptVersionCompareModal } from "@/components/PromptVersionCompareModal";

interface PromptLibraryPageProps {
  workspaceId: string;
}

export const PromptLibraryPage: React.FC<PromptLibraryPageProps> = ({
  workspaceId,
}) => {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [showTemplatesOnly, setShowTemplatesOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptItem | null>(null);

  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [comparePrompt, setComparePrompt] = useState<PromptItem | null>(null);

  const [newFolderName, setNewFolderName] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId, selectedFolderId, selectedCategory, searchQuery, showFavoritesOnly, showTemplatesOnly]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [foldersList, promptsList] = await Promise.all([
        promptService.listFolders(workspaceId),
        promptService.listPrompts(workspaceId, {
          category: selectedCategory || undefined,
          folderId: selectedFolderId === null ? undefined : selectedFolderId,
          search: searchQuery || undefined,
          isFavorite: showFavoritesOnly || undefined,
          isTemplate: showTemplatesOnly || undefined,
        }),
      ]);
      setFolders(foldersList);
      setPrompts(promptsList);
    } catch (err) {
      console.error("Failed to load prompt library data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await promptService.createFolder(workspaceId, { name: newFolderName.trim() });
      setNewFolderName("");
      setIsCreatingFolder(false);
      const updatedFolders = await promptService.listFolders(workspaceId);
      setFolders(updatedFolders);
    } catch (err) {
      console.error("Failed to create folder", err);
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this folder? Prompts inside will be moved to root.")) return;
    try {
      await promptService.deleteFolder(workspaceId, folderId);
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      const updatedFolders = await promptService.listFolders(workspaceId);
      setFolders(updatedFolders);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await promptService.toggleFavorite(workspaceId, promptId);
      setPrompts((prev) =>
        prev.map((p) => (p._id === promptId ? { ...p, isFavorite: res.isFavorite } : p)),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePrompt = async (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to archive this prompt?")) return;
    try {
      await promptService.deletePrompt(workspaceId, promptId);
      setPrompts((prev) => prev.filter((p) => p._id !== promptId));
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    { id: "", label: "All Categories" },
    { id: "general", label: "General" },
    { id: "development", label: "Development" },
    { id: "backend", label: "Backend" },
    { id: "frontend", label: "Frontend" },
    { id: "database", label: "Database" },
    { id: "ui-ux", label: "UI / UX" },
    { id: "documentation", label: "Documentation" },
    { id: "testing", label: "Testing" },
    { id: "security", label: "Security" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Prompt Library & Versioning
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                PromptOps v1.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage reusable prompt templates, Handlebars variables, SHA-256 canonical version hashes, and folders.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreatingFolder(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition"
          >
            <FolderPlus className="w-4 h-4 text-indigo-400" /> New Folder
          </button>
          <button
            onClick={() => {
              setEditingPrompt(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Create Prompt Template
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts or tags..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Quick Filters */}
          <div className="space-y-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Quick Views
            </div>
            <button
              onClick={() => {
                setSelectedFolderId(null);
                setShowFavoritesOnly(false);
                setShowTemplatesOnly(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                selectedFolderId === null && !showFavoritesOnly && !showTemplatesOnly
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4" /> All Prompts
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                {prompts.length}
              </span>
            </button>

            <button
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                setShowTemplatesOnly(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                showFavoritesOnly
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" /> Favorites
              </span>
            </button>
          </div>

          {/* Folders List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Folders ({folders.length})
              </span>
            </div>

            {isCreatingFolder && (
              <div className="p-2 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Folder name..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => setIsCreatingFolder(false)}
                    className="px-2 py-1 text-[10px] text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFolder}
                    className="px-2 py-1 text-[10px] bg-indigo-600 text-white rounded-md font-medium"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {folders.map((f) => (
              <div
                key={f._id}
                onClick={() => setSelectedFolderId(f._id)}
                className={`group px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                  selectedFolderId === f._id
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <FolderIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">{f.name}</span>
                </span>
                <button
                  onClick={(e) => handleDeleteFolder(f._id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Categories Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
              Categories
            </div>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  selectedCategory === c.id
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-300"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              Loading prompt library...
            </div>
          ) : prompts.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
              <div className="p-3 w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-white">No Prompts Found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No prompts match your filter parameters. Create a new prompt template to start managing versions.
              </p>
              <button
                onClick={() => {
                  setEditingPrompt(null);
                  setIsEditorOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Prompt Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prompts.map((p) => (
                <div
                  key={p._id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition flex flex-col justify-between group space-y-4 shadow-lg shadow-slate-950/40"
                >
                  <div className="space-y-2">
                    {/* Header bar */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition">
                            {p.name}
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold">
                            v{p.version}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                          {p.description || "No description provided."}
                        </p>
                      </div>

                      <button
                        onClick={(e) => handleToggleFavorite(p._id, e)}
                        className={`p-1.5 rounded-lg transition ${
                          p.isFavorite
                            ? "text-amber-400 bg-amber-500/10"
                            : "text-slate-600 hover:text-slate-300"
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>

                    {/* Metadata & Tag Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {p.category}
                      </span>
                      {p.hash && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {p.hash.slice(0, 8)}
                        </span>
                      )}
                      {(p.variables || []).length > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-violet-500/10 text-violet-400 border border-violet-500/20">
                          {p.variables.length} vars
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Snippet */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 line-clamp-3">
                    {p.body}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-3 text-xs text-slate-400">
                    <span className="text-[11px] text-slate-500">
                      By {p.createdBy?.name || "System"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setComparePrompt(p);
                          setIsCompareOpen(true);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition"
                        title="Compare 5-tab versions"
                      >
                        <GitBranch className="w-3.5 h-3.5 text-indigo-400" /> Compare
                      </button>

                      <button
                        onClick={() => {
                          setEditingPrompt(p);
                          setIsEditorOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                        title="Edit prompt"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDeletePrompt(p._id, e)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition"
                        title="Archive prompt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      <PromptEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        workspaceId={workspaceId}
        folders={folders}
        existingPrompt={editingPrompt}
        onSaved={() => {
          loadData();
        }}
      />

      {/* Compare Modal */}
      {comparePrompt && (
        <PromptVersionCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          workspaceId={workspaceId}
          prompt={comparePrompt}
        />
      )}
    </div>
  );
};

export default PromptLibraryPage;
