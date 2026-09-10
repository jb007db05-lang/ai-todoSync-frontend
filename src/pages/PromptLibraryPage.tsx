import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Plus,
  FolderPlus,
  Search,
  Folder as FolderIcon,
  Star,
  GitBranch,
  Layers,
  Trash2,
  ArrowLeft,
  Clock,
  X,
  Loader2,
  MoreVertical,
  Edit3,
  FolderInput,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  promptService,
  PromptItem,
  PromptFolder,
} from "@/services/prompts";
import { PromptVersionCompareModal } from "@/components/PromptVersionCompareModal";

interface PromptLibraryPageProps {
  workspaceId: string;
}

export const PromptLibraryPage: React.FC<PromptLibraryPageProps> = ({
  workspaceId,
}) => {
  const navigate = useNavigate();

  // Active View Toggle: "prompts" (default) or "folders"
  const [activeView, setActiveView] = useState<"prompts" | "folders">("prompts");

  // Data state
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCreatingPrompt, setIsCreatingPrompt] = useState<boolean>(false);

  // Filters & Selection
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Folder creation
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);

  // Active Card Dropdown Menu State
  const [activeMenuPromptId, setActiveMenuPromptId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Modals State
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [comparePrompt, setComparePrompt] = useState<PromptItem | null>(null);

  const [moveModalPrompt, setMoveModalPrompt] = useState<PromptItem | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const [deleteModalPrompt, setDeleteModalPrompt] = useState<PromptItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Toast / Banner Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  // Click outside and Escape key handler for active action dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuPromptId(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenuPromptId(null);
        if (moveModalPrompt && !isMoving) setMoveModalPrompt(null);
        if (deleteModalPrompt && !isDeleting) setDeleteModalPrompt(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moveModalPrompt, deleteModalPrompt, isMoving, isDeleting]);

  useEffect(() => {
    if (workspaceId) {
      loadData();
    }
  }, [workspaceId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [foldersList, promptsList] = await Promise.all([
        promptService.listFolders(workspaceId),
        promptService.listPrompts(workspaceId),
      ]);
      setFolders(foldersList);
      setPrompts(promptsList);
    } catch (err) {
      console.error("Failed to load prompt library data", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Automatic unique prompt naming algorithm:
   * Finds lowest available numeric suffix for "New Prompt".
   */
  const generateUniqueName = (currentPrompts: PromptItem[]) => {
    const existingNames = new Set(
      currentPrompts.map((p) => p.name.trim().toLowerCase())
    );

    if (!existingNames.has("new prompt")) {
      return "New Prompt";
    }

    let suffix = 1;
    while (existingNames.has(`new prompt ${suffix}`)) {
      suffix++;
    }
    return `New Prompt ${suffix}`;
  };

  /**
   * Primary Card Click Navigation to Playground
   */
  const openPromptInPlayground = (promptId: string, version: number) => {
    setActiveMenuPromptId(null);
    navigate(`/playground?promptId=${promptId}&version=${version}`);
  };

  /**
   * Direct New Prompt Creation Flow
   */
  const handleNewPrompt = async () => {
    if (isCreatingPrompt) return;
    try {
      setIsCreatingPrompt(true);
      const latestPrompts = await promptService.listPrompts(workspaceId);
      setPrompts(latestPrompts);

      const promptName = generateUniqueName(latestPrompts);

      const createdPrompt = await promptService.createPrompt(workspaceId, {
        name: promptName,
        description: "Created from Prompt Library",
        category: "general",
        body: "You are a helpful assistant.",
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      });

      openPromptInPlayground(createdPrompt._id, createdPrompt.version);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("Failed to create new prompt:", err);
      setErrorMessage(
        errorObj.response?.data?.message ||
          errorObj.message ||
          "Unable to create prompt. Please try again."
      );
      setIsCreatingPrompt(false);
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
      setSuccessMessage("Folder created successfully.");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("Failed to create folder", err);
      setErrorMessage(errorObj.response?.data?.message || "Failed to create folder.");
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this folder? Prompts inside will remain accessible.")) return;
    try {
      await promptService.deleteFolder(workspaceId, folderId);
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      const updatedFolders = await promptService.listFolders(workspaceId);
      setFolders(updatedFolders);
      const updatedPrompts = await promptService.listPrompts(workspaceId);
      setPrompts(updatedPrompts);
      setSuccessMessage("Folder deleted successfully.");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      console.error(err);
      setErrorMessage(errorObj.response?.data?.message || "Failed to delete folder.");
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

  // Move to folder action handler
  const handleOpenMoveModal = (prompt: PromptItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuPromptId(null);
    setMoveModalPrompt(prompt);
    setTargetFolderId(prompt.folderId || null);
  };

  const handleConfirmMove = async () => {
    if (!moveModalPrompt) return;
    try {
      setIsMoving(true);
      const updatedPrompt = await promptService.updatePrompt(
        workspaceId,
        moveModalPrompt._id,
        { folderId: targetFolderId }
      );

      setPrompts((prev) =>
        prev.map((p) => (p._id === updatedPrompt._id ? updatedPrompt : p))
      );

      const folderName = targetFolderId
        ? folders.find((f) => f._id === targetFolderId)?.name
        : "Uncategorized";

      setSuccessMessage(`Moved "${moveModalPrompt.name}" to ${folderName}.`);
      setMoveModalPrompt(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("Failed to move prompt to folder:", err);
      setErrorMessage(errorObj.response?.data?.message || "Failed to move prompt to folder.");
    } finally {
      setIsMoving(false);
    }
  };

  // Delete prompt action handler
  const handleOpenDeleteModal = (prompt: PromptItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuPromptId(null);
    setDeleteModalPrompt(prompt);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalPrompt) return;
    try {
      setIsDeleting(true);
      await promptService.deletePrompt(workspaceId, deleteModalPrompt._id);
      setPrompts((prev) => prev.filter((p) => p._id !== deleteModalPrompt._id));
      setSuccessMessage(`Deleted prompt "${deleteModalPrompt.name}".`);
      setDeleteModalPrompt(null);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("Failed to delete prompt:", err);
      setErrorMessage(errorObj.response?.data?.message || "Failed to delete prompt.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper mapping folderId -> Folder Name
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach((f) => map.set(f._id, f.name));
    return map;
  }, [folders]);

  // Helper counting prompts per folder
  const folderPromptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    prompts.forEach((p) => {
      if (p.folderId) {
        counts.set(p.folderId, (counts.get(p.folderId) || 0) + 1);
      }
    });
    return counts;
  }, [prompts]);

  // Filtered prompts calculation
  const displayedPrompts = useMemo(() => {
    return prompts.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = (p.description || "").toLowerCase().includes(q);
        const matchesBody = p.body.toLowerCase().includes(q);
        const matchesTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesBody && !matchesTags) return false;
      }
      if (showFavoritesOnly && !p.isFavorite) return false;
      if (activeView === "folders" && selectedFolderId !== null) {
        if (p.folderId !== selectedFolderId) return false;
      }
      return true;
    });
  }, [prompts, searchQuery, showFavoritesOnly, activeView, selectedFolderId]);

  // Format relative timestamp
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

  const currentFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find((f) => f._id === selectedFolderId) || null;
  }, [selectedFolderId, folders]);

  /**
   * Render Clean Prompt Card with Three-Dot Action Dropdown Menu
   */
  const renderPromptCard = (p: PromptItem) => {
    const folderName = p.folderId ? folderMap.get(p.folderId) : null;
    const isMenuOpen = activeMenuPromptId === p._id;

    return (
      <div
        key={p._id}
        onClick={() => openPromptInPlayground(p._id, p.version)}
        className="p-5 rounded-2xl bg-white border border-olive-200 hover:border-olive-400 transition-all shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between group space-y-4 relative"
      >
        <div className="space-y-3">
          {/* Top Row: Title, Version & Three-Dot Action Menu */}
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-olive-950 group-hover:text-olive-700 transition truncate">
                  {p.name}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-olive-100 text-olive-800 border border-olive-200 shrink-0">
                  {p.version > 0 ? `v${p.version}` : "Draft"}
                </span>
              </div>
              {p.description && (
                <p className="text-xs text-olive-600 line-clamp-1">
                  {p.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 relative">
              {/* Star / Favorite toggle */}
              <button
                type="button"
                onClick={(e) => handleToggleFavorite(p._id, e)}
                className={`p-1.5 rounded-lg transition ${
                  p.isFavorite
                    ? "text-amber-500 bg-amber-50"
                    : "text-olive-300 hover:text-amber-500 hover:bg-olive-50"
                }`}
                title={p.isFavorite ? "Remove favorite" : "Add to favorites"}
              >
                <Star className={`w-4 h-4 ${p.isFavorite ? "fill-current" : ""}`} />
              </button>

              {/* Three-Dot Menu Button */}
              <button
                type="button"
                aria-label={`Open actions for ${p.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuPromptId(isMenuOpen ? null : p._id);
                }}
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  isMenuOpen
                    ? "bg-olive-100 text-olive-900 border-olive-300"
                    : "text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-transparent"
                }`}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Action Menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 w-44 bg-white rounded-xl border border-gray-200 shadow-xl z-30 py-1 font-sans text-xs animate-in fade-in duration-100"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openPromptInPlayground(p._id, p.version);
                    }}
                    className="w-full px-3 py-2 text-left text-gray-700 hover:bg-olive-50 hover:text-olive-900 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuPromptId(null);
                      setComparePrompt(p);
                      setIsCompareOpen(true);
                    }}
                    className="w-full px-3 py-2 text-left text-gray-700 hover:bg-olive-50 hover:text-olive-900 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-gray-400" />
                    <span>Compare</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleOpenMoveModal(p, e)}
                    className="w-full px-3 py-2 text-left text-gray-700 hover:bg-olive-50 hover:text-olive-900 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <FolderInput className="w-3.5 h-3.5 text-gray-400" />
                    <span>Move to Folder</span>
                  </button>

                  <div className="my-1 border-t border-gray-100" />

                  <button
                    type="button"
                    onClick={(e) => handleOpenDeleteModal(p, e)}
                    className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition cursor-pointer font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Preview Snippet */}
          <div className="p-3 rounded-xl bg-olive-50/70 border border-olive-200/80 font-mono text-xs text-olive-800 line-clamp-3 leading-relaxed">
            {p.body || (p.messages && p.messages.length > 0 ? p.messages[0].content : "No body content")}
          </div>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {folderName && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-olive-100/80 text-olive-800 border border-olive-200">
                <FolderIcon className="w-3 h-3 text-olive-600" />
                {folderName}
              </span>
            )}

            {(p.variables || []).length > 0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                {(p.variables || []).length} vars
              </span>
            )}

            {p.hash && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {p.hash.slice(0, 7)}
              </span>
            )}
          </div>
        </div>

        {/* Footer Row: Timestamp & Creator (No redundant Playground button) */}
        <div className="flex items-center justify-between border-t border-olive-100 pt-3 text-xs text-olive-500">
          <div className="flex items-center gap-2 text-[11px] text-olive-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-olive-400" />
              {formatTimeAgo(p.updatedAt || p.createdAt)}
            </span>
            <span>•</span>
            <span className="truncate max-w-[120px]">
              {p.createdBy?.name || "User"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full bg-olive-50 text-olive-950 p-6 space-y-6 font-sans">
      {/* Top Bar / Header */}
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
          {/* New Folder Button */}
          <button
            onClick={() => {
              setActiveView("folders");
              setIsCreatingFolder(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-olive-50 border border-olive-200 text-olive-700 hover:text-olive-950 text-xs font-semibold flex items-center gap-2 transition shadow-2xs cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-olive-600" /> New Folder
          </button>

          {/* New Prompt Button */}
          <button
            onClick={handleNewPrompt}
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

      {/* Notifications Banner */}
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

      {/* Toolbar: Search input in flex with View Toggle & Favorites */}
      <div className="bg-white border border-olive-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-olive-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompts by name, description, tags or body..."
            className="w-full bg-olive-50/60 border border-olive-200 rounded-xl pl-9 pr-3 py-2 text-xs text-olive-950 placeholder-olive-400 focus:outline-none focus:border-olive-400 focus:ring-4 focus:ring-olive-700/5 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-olive-400 hover:text-olive-700"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Flex Controls: View Toggle & Favorites Button */}
        <div className="flex items-center gap-3">
          {/* Prompts | Folders View Toggle */}
          <div className="bg-olive-100/80 p-1 rounded-xl border border-olive-200 flex items-center gap-1 select-none">
            <button
              onClick={() => {
                setActiveView("prompts");
                setSelectedFolderId(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeView === "prompts"
                  ? "bg-olive-900 text-white shadow-2xs"
                  : "text-olive-700 hover:text-olive-950 hover:bg-olive-200/60"
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Prompts
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeView === "prompts"
                    ? "bg-olive-800 text-white"
                    : "bg-olive-200 text-olive-800"
                }`}
              >
                {prompts.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveView("folders");
                setSelectedFolderId(null);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeView === "folders"
                  ? "bg-olive-900 text-white shadow-2xs"
                  : "text-olive-700 hover:text-olive-950 hover:bg-olive-200/60"
              }`}
            >
              <FolderIcon className="w-3.5 h-3.5" /> Folders
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeView === "folders"
                    ? "bg-olive-800 text-white"
                    : "bg-olive-200 text-olive-800"
                }`}
              >
                {folders.length}
              </span>
            </button>
          </div>

          {/* Favorites Button */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
              showFavoritesOnly
                ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                : "bg-olive-50 hover:bg-olive-100 text-olive-700 border border-olive-200"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? "text-amber-500 fill-current" : "text-olive-400"}`} />
            Favorites
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {activeView === "prompts" ? (
        /* PROMPTS VIEW */
        <div className="space-y-5">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="p-5 rounded-2xl bg-white border border-olive-200 animate-pulse space-y-4 shadow-2xs"
                >
                  <div className="h-4 bg-olive-100 rounded-md w-3/4" />
                  <div className="h-3 bg-olive-100 rounded-md w-1/2" />
                  <div className="h-16 bg-olive-50 rounded-xl" />
                  <div className="h-3 bg-olive-100 rounded-md w-1/3" />
                </div>
              ))}
            </div>
          ) : displayedPrompts.length === 0 ? (
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
                  onClick={() => {
                    setSearchQuery("");
                    setShowFavoritesOnly(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-olive-100 hover:bg-olive-200 border border-olive-300 text-olive-900 text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={handleNewPrompt}
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedPrompts.map((p) => renderPromptCard(p))}
            </div>
          )}
        </div>
      ) : (
        /* FOLDERS VIEW */
        <div className="space-y-5">
          {/* Folders View Header / Breadcrumbs */}
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

            {/* Folder Creation Form Trigger / Inline Form */}
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
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") setIsCreatingFolder(false);
                  }}
                />
                <button
                  onClick={handleCreateFolder}
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

          {/* Folder Content Display */}
          {selectedFolderId !== null ? (
            /* DRILL-DOWN INTO SELECTED FOLDER PROMPTS */
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-5 rounded-2xl bg-white border border-olive-200 animate-pulse space-y-4 shadow-2xs">
                    <div className="h-4 bg-olive-100 rounded-md w-3/4" />
                    <div className="h-16 bg-olive-50 rounded-xl" />
                  </div>
                ))}
              </div>
            ) : displayedPrompts.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-olive-200 shadow-2xs space-y-4">
                <div className="p-4 w-14 h-14 rounded-2xl bg-olive-100 text-olive-800 border border-olive-200 mx-auto flex items-center justify-center">
                  <FolderIcon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-olive-950">This folder is empty</h3>
                  <p className="text-xs text-olive-600 max-w-sm mx-auto">
                    Add prompts to this folder to organize them here.
                  </p>
                </div>
                <button
                  onClick={handleNewPrompt}
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
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedPrompts.map((p) => renderPromptCard(p))}
              </div>
            )
          ) : (
            /* ROOT FOLDERS GRID VIEW */
            isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-5 rounded-2xl bg-white border border-olive-200 animate-pulse space-y-3 shadow-2xs">
                    <div className="h-5 bg-olive-100 rounded-md w-1/2" />
                    <div className="h-3 bg-olive-100 rounded-md w-1/3" />
                  </div>
                ))}
              </div>
            ) : folders.length === 0 ? (
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
                  onClick={() => setIsCreatingFolder(true)}
                  className="px-4 py-2 rounded-xl bg-olive-900 text-white text-xs font-semibold shadow-md shadow-olive-900/20 hover:bg-black transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" /> Create Folder
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {folders.map((f) => {
                  const count = folderPromptCounts.get(f._id) || 0;

                  return (
                    <div
                      key={f._id}
                      onClick={() => setSelectedFolderId(f._id)}
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
                          onClick={(e) => handleDeleteFolder(f._id, e)}
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
            )
          )}
        </div>
      )}

      {/* Compare Modal (Preserved & Reused) */}
      {comparePrompt && (
        <PromptVersionCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          workspaceId={workspaceId}
          prompt={comparePrompt}
          onOpenPlayground={(p, ver) => {
            navigate(`/playground?promptId=${p._id}&version=${ver || p.version}`);
          }}
        />
      )}

      {/* Move to Folder Modal */}
      {moveModalPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Move "{moveModalPrompt.name}" to...
              </h3>
              <button
                type="button"
                onClick={() => !isMoving && setMoveModalPrompt(null)}
                className="text-gray-400 hover:text-gray-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-64 overflow-y-auto custom-scrollbar text-xs">
              {/* Uncategorized Option */}
              <label
                onClick={() => setTargetFolderId(null)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  targetFolderId === null
                    ? "bg-olive-50 border-olive-400 font-bold text-olive-900"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-4 h-4 text-gray-400" />
                  <span>Uncategorized / No Folder</span>
                </div>
                <input
                  type="radio"
                  name="targetFolder"
                  checked={targetFolderId === null}
                  onChange={() => setTargetFolderId(null)}
                  className="accent-olive-700"
                />
              </label>

              {/* Existing Folders List */}
              {folders.map((f) => {
                const isSelected = targetFolderId === f._id;
                const count = folderPromptCounts.get(f._id) || 0;
                return (
                  <label
                    key={f._id}
                    onClick={() => setTargetFolderId(f._id)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? "bg-olive-50 border-olive-400 font-bold text-olive-900"
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
                      name="targetFolder"
                      checked={isSelected}
                      onChange={() => setTargetFolderId(f._id)}
                      className="accent-olive-700"
                    />
                  </label>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50/50">
              <button
                type="button"
                disabled={isMoving}
                onClick={() => setMoveModalPrompt(null)}
                className="px-4 py-1.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMoving}
                onClick={handleConfirmMove}
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
      )}

      {/* Delete Confirmation Modal */}
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
                onClick={handleConfirmDelete}
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

export default PromptLibraryPage;
