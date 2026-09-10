import React from "react";
import { FileText, Plus } from "lucide-react";
import { PromptItem, PromptFolder, PromptVersion, promptService, PlaygroundRunResult } from "@/services/prompts";
import { PlaygroundSidebar } from "./PlaygroundSidebar";
import { PromptHeader } from "./PromptHeader";
import { PromptEditor } from "./PromptEditor";
import { VersionSelector } from "./VersionSelector";
import { VariableEditor } from "./VariableEditor";
import { ParameterDrawer } from "./ParameterDrawer";
import { PromptExecutionPanel } from "./PromptExecutionPanel";
import { PromptMoveModal } from "../../library/components/PromptMoveModal";
import { PromptVersionCompareModal } from "@/components/PromptVersionCompareModal";
import { PromptParameters } from "../hooks/usePlayground";

interface PlaygroundLayoutProps {
  workspaceId: string;
  folders: PromptFolder[];
  promptsByFolder: Record<string, PromptItem[]>;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedPromptId: string | null;
  setSelectedPromptId: (id: string | null) => void;
  isLoadingLibrary: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activePrompt: PromptItem | null;
  setActivePrompt: (prompt: PromptItem | null) => void;
  versionsList: PromptVersion[];
  selectedVersionNum: number;
  setSelectedVersionNum: (ver: number) => void;
  activeTab: "prompt" | "versions" | "variables" | "test";
  setActiveTab: (tab: "prompt" | "versions" | "variables" | "test") => void;
  isEditingPromptContent: boolean;
  setIsEditingPromptContent: (editing: boolean) => void;
  editorMode: "blocks" | "raw";
  setEditorMode: (mode: "blocks" | "raw") => void;
  body: string;
  setBody: (body: string) => void;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  setMessages: React.Dispatch<React.SetStateAction<Array<{ role: "system" | "user" | "assistant"; content: string }>>>;
  variablesSchema: Array<{ name: string; type?: "string" | "number" | "json" | "boolean" | "enum"; defaultValue?: string; required: boolean }>;
  setVariablesSchema: React.Dispatch<React.SetStateAction<Array<{ name: string; type?: "string" | "number" | "json" | "boolean" | "enum"; defaultValue?: string; required: boolean }>>>;
  runtimeValues: Record<string, unknown>;
  setRuntimeValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  parameters: PromptParameters;
  setParameters: React.Dispatch<React.SetStateAction<PromptParameters>>;
  isParametersModalOpen: boolean;
  setIsParametersModalOpen: (open: boolean) => void;
  modalTempParams: PromptParameters;
  setModalTempParams: React.Dispatch<React.SetStateAction<PromptParameters>>;
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
  runResult: unknown;
  setRunResult: (result: PlaygroundRunResult | null) => void;
  executionError: string | null;
  setExecutionError: (err: string | null) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
  moveModalPrompt: PromptItem | null;
  setMoveModalPrompt: (prompt: PromptItem | null) => void;
  targetFolderId: string | null;
  setTargetFolderId: (id: string | null) => void;
  isMoving: boolean;
  setIsMoving: (moving: boolean) => void;
  hasVersionedConfigurationChanged: boolean;
  onSavePrompt: () => void;
  onNewPromptImmediate: () => void;
  loadPromptDetails: (promptId: string, versionNumber?: number) => void;
}

export const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = ({
  workspaceId,
  folders,
  promptsByFolder,
  expandedFolders,
  setExpandedFolders,
  selectedPromptId,
  setSelectedPromptId,
  isLoadingLibrary,
  searchQuery,
  setSearchQuery,
  activePrompt,
  setActivePrompt,
  versionsList,
  selectedVersionNum,
  activeTab,
  setActiveTab,
  isEditingPromptContent,
  setIsEditingPromptContent,
  editorMode,
  setEditorMode,
  body,
  setBody,
  messages,
  setMessages,
  variablesSchema,
  setVariablesSchema,
  runtimeValues,
  setRuntimeValues,
  parameters,
  setParameters,
  isParametersModalOpen,
  setIsParametersModalOpen,
  modalTempParams,
  setModalTempParams,
  isExecuting,
  setIsExecuting,
  runResult,
  setRunResult,
  executionError,
  setExecutionError,
  isSaving,
  moveModalPrompt,
  setMoveModalPrompt,
  targetFolderId,
  setTargetFolderId,
  isMoving,
  setIsMoving,
  hasVersionedConfigurationChanged,
  onSavePrompt,
  onNewPromptImmediate,
  loadPromptDetails,
}) => {
  const [isCompareOpen, setIsCompareOpen] = React.useState(false);

  const folderPromptCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    Object.entries(promptsByFolder).forEach(([fId, items]) => {
      if (fId !== "uncategorized") counts.set(fId, items.length);
    });
    return counts;
  }, [promptsByFolder]);

  return (
    <div className="flex h-full min-h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <PlaygroundSidebar
        folders={folders}
        promptsByFolder={promptsByFolder}
        expandedFolders={expandedFolders}
        setExpandedFolders={setExpandedFolders}
        selectedPromptId={selectedPromptId}
        isLoadingLibrary={isLoadingLibrary}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectPrompt={(id) => {
          setSelectedPromptId(id);
          loadPromptDetails(id);
        }}
        onNewPrompt={onNewPromptImmediate}
      />

      <main className="flex-1 min-w-0 w-full flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-6 bg-white">
        {!selectedPromptId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3 max-w-sm mx-auto">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">No Prompt Selected</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Select an existing prompt from the left navigation or create a new prompt to get started.
            </p>
            <button
              type="button"
              onClick={onNewPromptImmediate}
              className="px-4 py-2 rounded-lg bg-olive-700 hover:bg-olive-800 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create New Prompt
            </button>
          </div>
        ) : (
          <div className="space-y-6 w-full">
            <PromptHeader
              activePrompt={activePrompt}
              selectedVersionNum={selectedVersionNum}
              hasVersionedConfigurationChanged={hasVersionedConfigurationChanged}
              isSaving={isSaving}
              isEditingPromptContent={isEditingPromptContent}
              onSavePrompt={onSavePrompt}
              onToggleEditStructure={() => setIsEditingPromptContent(!isEditingPromptContent)}
              onOpenMoveModal={() => {
                if (activePrompt) {
                  setMoveModalPrompt(activePrompt);
                  setTargetFolderId(activePrompt.folderId || null);
                }
              }}
            />

            <div className="border-b border-gray-200 flex items-center gap-6 text-xs font-semibold w-full">
              <button
                type="button"
                onClick={() => setActiveTab("prompt")}
                className={`pb-2.5 transition relative cursor-pointer ${
                  activeTab === "prompt"
                    ? "text-olive-800 font-bold border-b-2 border-olive-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Prompt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("versions")}
                className={`pb-2.5 transition relative cursor-pointer ${
                  activeTab === "versions"
                    ? "text-olive-800 font-bold border-b-2 border-olive-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Versions ({versionsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("variables")}
                className={`pb-2.5 transition relative cursor-pointer ${
                  activeTab === "variables"
                    ? "text-olive-800 font-bold border-b-2 border-olive-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Variables ({variablesSchema.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("test")}
                className={`pb-2.5 transition relative cursor-pointer ${
                  activeTab === "test"
                    ? "text-olive-800 font-bold border-b-2 border-olive-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Execution & Test
              </button>
            </div>

            {activeTab === "prompt" && (
              <PromptEditor
                editorMode={editorMode}
                setEditorMode={setEditorMode}
                messages={messages}
                setMessages={setMessages}
                body={body}
                setBody={setBody}
                isEditingPromptContent={isEditingPromptContent}
              />
            )}

            {activeTab === "versions" && (
              <VersionSelector
                versionsList={versionsList}
                selectedVersionNum={selectedVersionNum}
                onSelectVersion={(verNum) => {
                  if (selectedPromptId) loadPromptDetails(selectedPromptId, verNum);
                }}
                onOpenCompare={() => setIsCompareOpen(true)}
              />
            )}

            {activeTab === "variables" && (
              <VariableEditor
                variablesSchema={variablesSchema}
                setVariablesSchema={setVariablesSchema}
                runtimeValues={runtimeValues}
                setRuntimeValues={setRuntimeValues}
                isEditingPromptContent={isEditingPromptContent}
              />
            )}

            {activeTab === "test" && (
              <PromptExecutionPanel
                workspaceId={workspaceId}
                promptId={selectedPromptId}
                body={body}
                messages={messages}
                runtimeValues={runtimeValues}
                parameters={parameters}
                isExecuting={isExecuting}
                setIsExecuting={setIsExecuting}
                runResult={runResult as PlaygroundRunResult | null}
                setRunResult={setRunResult}
                executionError={executionError}
                setExecutionError={setExecutionError}
                onOpenParametersModal={() => {
                  setModalTempParams(parameters);
                  setIsParametersModalOpen(true);
                }}
              />
            )}
          </div>
        )}
      </main>

      <ParameterDrawer
        isOpen={isParametersModalOpen}
        onClose={() => setIsParametersModalOpen(false)}
        tempParams={modalTempParams}
        setTempParams={setModalTempParams}
        onSave={() => {
          setParameters(modalTempParams);
          setIsParametersModalOpen(false);
        }}
      />

      {moveModalPrompt && (
        <PromptMoveModal
          prompt={moveModalPrompt}
          folders={folders}
          folderPromptCounts={folderPromptCounts}
          targetFolderId={targetFolderId}
          setTargetFolderId={setTargetFolderId}
          isMoving={isMoving}
          onClose={() => setMoveModalPrompt(null)}
          onConfirmMove={async () => {
            if (!moveModalPrompt) return;
            try {
              setIsMoving(true);
              const updated = await promptService.updatePrompt(
                workspaceId,
                moveModalPrompt._id,
                { folderId: targetFolderId }
              );
              if (activePrompt && activePrompt._id === updated._id) {
                setActivePrompt(updated);
              }
              setMoveModalPrompt(null);
            } catch (err) {
              console.error("Failed to move prompt", err);
            } finally {
              setIsMoving(false);
            }
          }}
        />
      )}

      {activePrompt && (
        <PromptVersionCompareModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          workspaceId={workspaceId}
          prompt={activePrompt}
          onOpenPlayground={(p, ver) => {
            if (p._id) loadPromptDetails(p._id, ver);
          }}
        />
      )}
    </div>
  );
};
