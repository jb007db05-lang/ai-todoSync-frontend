import { useState, useEffect, useMemo, useCallback } from "react";
import { promptService, PromptItem, PromptFolder } from "@/services/prompts";

export function usePromptLibrary(workspaceId: string) {
  const [activeView, setActiveView] = useState<"prompts" | "folders">("prompts");
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

  // Dropdown menu state
  const [activeMenuPromptId, setActiveMenuPromptId] = useState<string | null>(null);

  // Modals
  const [moveModalPrompt, setMoveModalPrompt] = useState<PromptItem | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const [deleteModalPrompt, setDeleteModalPrompt] = useState<PromptItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
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
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (errorMessage || successMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, successMessage]);

  const generateUniqueName = (currentPrompts: PromptItem[]) => {
    const existingNames = new Set(
      currentPrompts.map((p) => p.name.trim().toLowerCase())
    );
    if (!existingNames.has("new prompt")) return "New Prompt";
    let suffix = 1;
    while (existingNames.has(`new prompt ${suffix}`)) suffix++;
    return `New Prompt ${suffix}`;
  };

  const handleNewPrompt = async (onCreated: (promptId: string, version: number) => void) => {
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
      onCreated(createdPrompt._id, createdPrompt.version);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      console.error("Failed to create new prompt:", err);
      setErrorMessage(errorObj.response?.data?.message || errorObj.message || "Unable to create prompt.");
    } finally {
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
      setErrorMessage(errorObj.response?.data?.message || "Failed to create folder.");
    }
  };

  const handleDeleteFolder = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this folder? Prompts inside will remain accessible.")) return;
    try {
      await promptService.deleteFolder(workspaceId, folderId);
      if (selectedFolderId === folderId) setSelectedFolderId(null);
      const [updatedFolders, updatedPrompts] = await Promise.all([
        promptService.listFolders(workspaceId),
        promptService.listPrompts(workspaceId),
      ]);
      setFolders(updatedFolders);
      setPrompts(updatedPrompts);
      setSuccessMessage("Folder deleted successfully.");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(errorObj.response?.data?.message || "Failed to delete folder.");
    }
  };

  const handleToggleFavorite = async (promptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await promptService.toggleFavorite(workspaceId, promptId);
      setPrompts((prev) =>
        prev.map((p) => (p._id === promptId ? { ...p, isFavorite: res.isFavorite } : p))
      );
    } catch (err) {
      console.error(err);
    }
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
      setErrorMessage(errorObj.response?.data?.message || "Failed to move prompt to folder.");
    } finally {
      setIsMoving(false);
    }
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
      setErrorMessage(errorObj.response?.data?.message || "Failed to delete prompt.");
    } finally {
      setIsDeleting(false);
    }
  };

  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach((f) => map.set(f._id, f.name));
    return map;
  }, [folders]);

  const folderPromptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    prompts.forEach((p) => {
      if (p.folderId) counts.set(p.folderId, (counts.get(p.folderId) || 0) + 1);
    });
    return counts;
  }, [prompts]);

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

  return {
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
    handleNewPrompt,
    handleCreateFolder,
    handleDeleteFolder,
    handleToggleFavorite,
    handleConfirmMove,
    handleConfirmDelete,
  };
}
