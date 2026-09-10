import React from "react";
import { promptService } from "@/services/prompts";
import { usePlayground } from "@/features/prompts/playground/hooks/usePlayground";
import { PlaygroundLayout } from "@/features/prompts/playground/components/PlaygroundLayout";

interface PromptPlaygroundPageProps {
  workspaceId: string;
}

export const PromptPlaygroundPage: React.FC<PromptPlaygroundPageProps> = ({ workspaceId }) => {
  const pg = usePlayground(workspaceId);

  const handleSavePrompt = async () => {
    if (!pg.activePrompt) return;
    try {
      pg.setIsSaving(true);
      const updated = await promptService.updatePrompt(workspaceId, pg.activePrompt._id, {
        body: pg.body,
        messages: pg.messages,
        variables: pg.variablesSchema,
        parameters: {
          temperature: pg.parameters.temperature,
          maxTokens: pg.parameters.maxTokens,
          topP: pg.parameters.topP,
          responseFormat: pg.parameters.responseFormat,
        },
        provider: pg.parameters.provider,
        modelName: pg.parameters.modelName,
      });

      const createdVer = await promptService.createVersion(workspaceId, pg.activePrompt._id, {
        changelog: `Updated in Playground`,
        body: pg.body,
        messages: pg.messages,
        variables: pg.variablesSchema,
        parameters: {
          temperature: pg.parameters.temperature,
          maxTokens: pg.parameters.maxTokens,
          topP: pg.parameters.topP,
          responseFormat: pg.parameters.responseFormat,
        },
        provider: pg.parameters.provider,
        modelName: pg.parameters.modelName,
      });

      pg.setActivePrompt(updated);
      pg.setSelectedVersionNum(createdVer.version);
      pg.setSavedSnapshot({
        body: pg.body,
        messages: pg.messages,
        variables: pg.variablesSchema,
        parameters: pg.parameters,
      });

      const versionsData = await promptService.listVersions(workspaceId, pg.activePrompt._id);
      pg.setVersionsList(versionsData);
    } catch (err) {
      console.error("Failed to save prompt in playground", err);
    } finally {
      pg.setIsSaving(false);
    }
  };

  const handleNewPromptImmediate = async () => {
    try {
      const created = await promptService.createPrompt(workspaceId, {
        name: `New Prompt ${Date.now().toString().slice(-4)}`,
        description: "Created in Prompt Playground",
        category: "general",
        body: "You are a helpful assistant.",
        messages: [{ role: "system", content: "You are a helpful assistant." }],
      });
      pg.setSelectedPromptId(created._id);
      pg.loadPromptDetails(created._id);
    } catch (err) {
      console.error("Failed to create new prompt", err);
    }
  };

  return (
    <PlaygroundLayout
      workspaceId={workspaceId}
      folders={pg.folders}
      promptsByFolder={pg.promptsByFolder}
      expandedFolders={pg.expandedFolders}
      setExpandedFolders={pg.setExpandedFolders}
      selectedPromptId={pg.selectedPromptId}
      setSelectedPromptId={pg.setSelectedPromptId}
      isLoadingLibrary={pg.isLoadingLibrary}
      searchQuery={pg.searchQuery}
      setSearchQuery={pg.setSearchQuery}
      activePrompt={pg.activePrompt}
      setActivePrompt={pg.setActivePrompt}
      versionsList={pg.versionsList}
      selectedVersionNum={pg.selectedVersionNum}
      setSelectedVersionNum={pg.setSelectedVersionNum}
      activeTab={pg.activeTab}
      setActiveTab={pg.setActiveTab}
      isEditingPromptContent={pg.isEditingPromptContent}
      setIsEditingPromptContent={pg.setIsEditingPromptContent}
      editorMode={pg.editorMode}
      setEditorMode={pg.setEditorMode}
      body={pg.body}
      setBody={pg.setBody}
      messages={pg.messages}
      setMessages={pg.setMessages}
      variablesSchema={pg.variablesSchema}
      setVariablesSchema={pg.setVariablesSchema}
      runtimeValues={pg.runtimeValues}
      setRuntimeValues={pg.setRuntimeValues}
      parameters={pg.parameters}
      setParameters={pg.setParameters}
      isParametersModalOpen={pg.isParametersModalOpen}
      setIsParametersModalOpen={pg.setIsParametersModalOpen}
      modalTempParams={pg.modalTempParams}
      setModalTempParams={pg.setModalTempParams}
      isExecuting={pg.isExecuting}
      setIsExecuting={pg.setIsExecuting}
      runResult={pg.runResult}
      setRunResult={pg.setRunResult}
      executionError={pg.executionError}
      setExecutionError={pg.setExecutionError}
      isSaving={pg.isSaving}
      setIsSaving={pg.setIsSaving}
      moveModalPrompt={pg.moveModalPrompt}
      setMoveModalPrompt={pg.setMoveModalPrompt}
      targetFolderId={pg.targetFolderId}
      setTargetFolderId={pg.setTargetFolderId}
      isMoving={pg.isMoving}
      setIsMoving={pg.setIsMoving}
      hasVersionedConfigurationChanged={pg.hasVersionedConfigurationChanged}
      onSavePrompt={handleSavePrompt}
      onNewPromptImmediate={handleNewPromptImmediate}
      loadPromptDetails={pg.loadPromptDetails}
    />
  );
};

export default PromptPlaygroundPage;
