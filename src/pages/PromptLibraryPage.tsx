import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PromptItem } from "@/services/prompts";
import { usePromptLibrary } from "@/features/prompts/library/hooks/usePromptLibrary";
import { PromptLibraryLayout } from "@/features/prompts/library/components/PromptLibraryLayout";

interface PromptLibraryPageProps {
  workspaceId: string;
}

export const PromptLibraryPage: React.FC<PromptLibraryPageProps> = ({ workspaceId }) => {
  const navigate = useNavigate();
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [comparePrompt, setComparePrompt] = useState<PromptItem | null>(null);

  const library = usePromptLibrary(workspaceId);

  const openPromptInPlayground = (promptId: string, version: number) => {
    library.setActiveMenuPromptId(null);
    navigate(`/playground?promptId=${promptId}&version=${version}`);
  };

  return (
    <PromptLibraryLayout
      workspaceId={workspaceId}
      activeView={library.activeView}
      setActiveView={library.setActiveView}
      prompts={library.prompts}
      folders={library.folders}
      isLoading={library.isLoading}
      isCreatingPrompt={library.isCreatingPrompt}
      selectedFolderId={library.selectedFolderId}
      setSelectedFolderId={library.setSelectedFolderId}
      searchQuery={library.searchQuery}
      setSearchQuery={library.setSearchQuery}
      showFavoritesOnly={library.showFavoritesOnly}
      setShowFavoritesOnly={library.setShowFavoritesOnly}
      newFolderName={library.newFolderName}
      setNewFolderName={library.setNewFolderName}
      isCreatingFolder={library.isCreatingFolder}
      setIsCreatingFolder={library.setIsCreatingFolder}
      activeMenuPromptId={library.activeMenuPromptId}
      setActiveMenuPromptId={library.setActiveMenuPromptId}
      moveModalPrompt={library.moveModalPrompt}
      setMoveModalPrompt={library.setMoveModalPrompt}
      targetFolderId={library.targetFolderId}
      setTargetFolderId={library.setTargetFolderId}
      isMoving={library.isMoving}
      deleteModalPrompt={library.deleteModalPrompt}
      setDeleteModalPrompt={library.setDeleteModalPrompt}
      isDeleting={library.isDeleting}
      errorMessage={library.errorMessage}
      setErrorMessage={library.setErrorMessage}
      successMessage={library.successMessage}
      setSuccessMessage={library.setSuccessMessage}
      displayedPrompts={library.displayedPrompts}
      folderMap={library.folderMap}
      folderPromptCounts={library.folderPromptCounts}
      onNewPrompt={library.handleNewPrompt}
      onCreateFolder={library.handleCreateFolder}
      onDeleteFolder={library.handleDeleteFolder}
      onToggleFavorite={library.handleToggleFavorite}
      onConfirmMove={library.handleConfirmMove}
      onConfirmDelete={library.handleConfirmDelete}
      onOpenPlayground={openPromptInPlayground}
      comparePrompt={comparePrompt}
      setComparePrompt={setComparePrompt}
      isCompareOpen={isCompareOpen}
      setIsCompareOpen={setIsCompareOpen}
    />
  );
};

export default PromptLibraryPage;
