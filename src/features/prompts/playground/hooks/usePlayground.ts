import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  promptService,
  PromptItem,
  PromptVersion,
  PromptFolder,
  PromptCanaryDeployment,
  IPromptMessage,
  IPromptVariable,
  PlaygroundRunResult,
} from "@/services/prompts";

export interface PromptParameters {
  temperature: number;
  maxTokens: number;
  topP: number;
  responseFormat: "text" | "json";
  provider: string;
  modelName: string;
}

export const DEFAULT_PARAMETERS: PromptParameters = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 1.0,
  responseFormat: "text",
  provider: "openai",
  modelName: "gpt-4o",
};

export function usePlayground(workspaceId: string) {
  const [searchParams] = useSearchParams();
  const initialPromptId = searchParams.get("promptId");
  const initialVersion = searchParams.get("version");

  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isLoadingLibrary, setIsLoadingLibrary] = useState<boolean>(true);

  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(initialPromptId);
  const [activePrompt, setActivePrompt] = useState<PromptItem | null>(null);
  const [versionsList, setVersionsList] = useState<PromptVersion[]>([]);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(initialVersion ? Number(initialVersion) : 0);
  const [activeCanary, setActiveCanary] = useState<PromptCanaryDeployment | null>(null);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState<boolean>(false);
  const [isCanaryActionLoading, setIsCanaryActionLoading] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"prompt" | "versions" | "variables" | "test">("prompt");
  const [isEditingPromptContent, setIsEditingPromptContent] = useState<boolean>(false);
  const [isCreatingNewPrompt, setIsCreatingNewPrompt] = useState<boolean>(false);

  const [editorMode, setEditorMode] = useState<"blocks" | "raw">("blocks");
  const [body, setBody] = useState<string>("");
  const [messages, setMessages] = useState<IPromptMessage[]>([
    { role: "system", content: "You are a senior software developer assistant." },
    { role: "user", content: "Analyze code module {{module_name}} in language {{language}}." },
  ]);

  const [variablesSchema, setVariablesSchema] = useState<IPromptVariable[]>([]);
  const [runtimeValues, setRuntimeValues] = useState<Record<string, unknown>>({});
  const [previewMode, setPreviewMode] = useState<"template" | "resolved">("template");

  const [parameters, setParameters] = useState<PromptParameters>(DEFAULT_PARAMETERS);
  const [isParametersModalOpen, setIsParametersModalOpen] = useState<boolean>(false);
  const [modalTempParams, setModalTempParams] = useState<PromptParameters>(DEFAULT_PARAMETERS);

  const [savedSnapshot, setSavedSnapshot] = useState<{
    body: string;
    messages: IPromptMessage[];
    variables: IPromptVariable[];
    parameters: PromptParameters;
  }>({
    body: "",
    messages: [],
    variables: [],
    parameters: DEFAULT_PARAMETERS,
  });

  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [runResult, setRunResult] = useState<PlaygroundRunResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [moveModalPrompt, setMoveModalPrompt] = useState<PromptItem | null>(null);
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);

  const loadInitialData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoadingLibrary(true);
      const [foldersList, promptsList] = await Promise.all([
        promptService.listFolders(workspaceId),
        promptService.listPrompts(workspaceId),
      ]);
      setFolders(foldersList);
      setPrompts(promptsList);

      const expMap: Record<string, boolean> = { uncategorized: true };
      foldersList.forEach((f) => { expMap[f._id] = true; });
      setExpandedFolders(expMap);

      if (initialPromptId) {
        const found = promptsList.find((p) => p._id === initialPromptId);
        if (found) {
          setSelectedPromptId(found._id);
        }
      }
    } catch (err) {
      console.error("Failed to load prompt playground data", err);
    } finally {
      setIsLoadingLibrary(false);
    }
  }, [workspaceId, initialPromptId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadPromptDetails = useCallback(
    async (promptId: string, versionNumber?: number) => {
      try {
        const [promptData, versionsData, canaryData] = await Promise.all([
          promptService.getPrompt(workspaceId, promptId),
          promptService.listVersions(workspaceId, promptId),
          promptService.getCanaryDeployment(workspaceId, promptId).catch(() => null),
        ]);

        setActivePrompt(promptData);
        setVersionsList(versionsData);
        setActiveCanary(canaryData);

        let targetVersionObj: PromptVersion | undefined;
        let versionToSet = promptData.version;

        if (typeof versionNumber === "number" && versionNumber > 0) {
          targetVersionObj = versionsData.find((v) => v.version === versionNumber);
          if (targetVersionObj) {
            versionToSet = versionNumber;
          }
        }

        setSelectedVersionNum(versionToSet);

        const currentBody = targetVersionObj?.body ?? promptData.body ?? "";
        const currentMessages = targetVersionObj?.messages ?? promptData.messages ?? [];
        const currentVariables = targetVersionObj?.variables ?? promptData.variables ?? [];
        const loadedParams: PromptParameters = {
          temperature: targetVersionObj?.parameters?.temperature ?? promptData.parameters?.temperature ?? DEFAULT_PARAMETERS.temperature,
          maxTokens: targetVersionObj?.parameters?.maxTokens ?? promptData.parameters?.maxTokens ?? DEFAULT_PARAMETERS.maxTokens,
          topP: targetVersionObj?.parameters?.topP ?? promptData.parameters?.topP ?? DEFAULT_PARAMETERS.topP,
          responseFormat: targetVersionObj?.parameters?.responseFormat ?? promptData.parameters?.responseFormat ?? DEFAULT_PARAMETERS.responseFormat,
          provider: targetVersionObj?.provider ?? promptData.provider ?? DEFAULT_PARAMETERS.provider,
          modelName: targetVersionObj?.modelName ?? promptData.modelName ?? DEFAULT_PARAMETERS.modelName,
        };

        setBody(currentBody);
        setMessages(currentMessages);
        setVariablesSchema(currentVariables);
        setParameters(loadedParams);

        const initRuntimeVals: Record<string, unknown> = {};
        currentVariables.forEach((v) => {
          if (v.defaultValue) initRuntimeVals[v.name] = v.defaultValue;
        });
        setRuntimeValues(initRuntimeVals);

        setSavedSnapshot({
          body: currentBody,
          messages: currentMessages,
          variables: currentVariables,
          parameters: loadedParams,
        });

        setIsCreatingNewPrompt(false);
        setRunResult(null);
        setExecutionError(null);
      } catch (err) {
        console.error("Failed to load prompt details", err);
      }
    },
    [workspaceId]
  );

  useEffect(() => {
    if (selectedPromptId) {
      loadPromptDetails(selectedPromptId, selectedVersionNum);
    }
  }, [selectedPromptId, loadPromptDetails]);

  const hasVersionedConfigurationChanged = useMemo(() => {
    if (!activePrompt) return false;
    if (body !== savedSnapshot.body) return true;
    if (JSON.stringify(messages) !== JSON.stringify(savedSnapshot.messages)) return true;
    if (JSON.stringify(variablesSchema) !== JSON.stringify(savedSnapshot.variables)) return true;
    if (JSON.stringify(parameters) !== JSON.stringify(savedSnapshot.parameters)) return true;
    return false;
  }, [activePrompt, body, messages, variablesSchema, parameters, savedSnapshot]);

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const q = searchQuery.toLowerCase();
    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
    );
  }, [prompts, searchQuery]);

  const promptsByFolder = useMemo(() => {
    const map: Record<string, PromptItem[]> = { uncategorized: [] };
    folders.forEach((f) => { map[f._id] = []; });
    filteredPrompts.forEach((p) => {
      if (p.folderId && map[p.folderId]) {
        map[p.folderId].push(p);
      } else {
        map.uncategorized.push(p);
      }
    });
    return map;
  }, [folders, filteredPrompts]);

  const [isPublishingProduction, setIsPublishingProduction] = useState<boolean>(false);

  const handlePublishProduction = useCallback(
    async (versionNum?: number) => {
      if (!activePrompt) return;
      const targetVer = versionNum || selectedVersionNum || activePrompt.version;
      if (!targetVer) return;
      try {
        setIsPublishingProduction(true);
        await promptService.publishProductionVersion(workspaceId, activePrompt._id, targetVer);
        await loadPromptDetails(activePrompt._id, selectedVersionNum);
      } catch (err) {
        console.error("Failed to publish production prompt version", err);
      } finally {
        setIsPublishingProduction(false);
      }
    },
    [workspaceId, activePrompt, selectedVersionNum, loadPromptDetails]
  );

  // Canary & Deployment Actions
  const handleMoveToStaging = useCallback(
    async (versionNum: number) => {
      if (!activePrompt) return;
      try {
        setIsCanaryActionLoading(true);
        await promptService.moveToStaging(workspaceId, activePrompt._id, versionNum);
        setIsDeployModalOpen(false);
        await loadPromptDetails(activePrompt._id, selectedVersionNum);
      } catch (err) {
        console.error("Failed to move prompt version to staging", err);
      } finally {
        setIsCanaryActionLoading(false);
      }
    },
    [workspaceId, activePrompt, selectedVersionNum, loadPromptDetails]
  );

  const handleMoveToDevelopment = useCallback(
    async (versionNum: number) => {
      if (!activePrompt) return;
      try {
        setIsCanaryActionLoading(true);
        await promptService.moveToDevelopment(workspaceId, activePrompt._id, versionNum);
        setIsDeployModalOpen(false);
        await loadPromptDetails(activePrompt._id, selectedVersionNum);
      } catch (err) {
        console.error("Failed to move prompt version to development", err);
      } finally {
        setIsCanaryActionLoading(false);
      }
    },
    [workspaceId, activePrompt, selectedVersionNum, loadPromptDetails]
  );

  const handleDeployDirect = useCallback(
    async (versionNum: number) => {
      if (!activePrompt) return;
      try {
        setIsCanaryActionLoading(true);
        await promptService.deployDirectToProduction(workspaceId, activePrompt._id, versionNum);
        setIsDeployModalOpen(false);
        await loadPromptDetails(activePrompt._id, selectedVersionNum);
      } catch (err) {
        console.error("Failed to deploy directly to production", err);
      } finally {
        setIsCanaryActionLoading(false);
      }
    },
    [workspaceId, activePrompt, selectedVersionNum, loadPromptDetails]
  );

  const handleStartCanary = useCallback(
    async (candidateVersionNum: number, options?: { minRequests?: number; errorThreshold?: number }) => {
      if (!activePrompt) return;
      try {
        setIsCanaryActionLoading(true);
        const canary = await promptService.startCanary(workspaceId, activePrompt._id, candidateVersionNum, options);
        setActiveCanary(canary);
        setIsDeployModalOpen(false);
        await loadPromptDetails(activePrompt._id, selectedVersionNum);
      } catch (err) {
        console.error("Failed to start canary deployment", err);
      } finally {
        setIsCanaryActionLoading(false);
      }
    },
    [workspaceId, activePrompt, selectedVersionNum, loadPromptDetails]
  );

  const handleAdvanceCanary = useCallback(async () => {
    if (!activePrompt) return;
    try {
      setIsCanaryActionLoading(true);
      const canary = await promptService.advanceCanary(workspaceId, activePrompt._id);
      setActiveCanary(canary);
      await loadPromptDetails(activePrompt._id, selectedVersionNum);
    } catch (err) {
      console.error("Failed to advance canary deployment", err);
    } finally {
      setIsCanaryActionLoading(false);
    }
  }, [workspaceId, activePrompt, selectedVersionNum, loadPromptDetails]);

  const handlePauseCanary = useCallback(async () => {
    if (!activePrompt) return;
    try {
      setIsCanaryActionLoading(true);
      const canary = await promptService.pauseCanary(workspaceId, activePrompt._id);
      setActiveCanary(canary);
    } catch (err) {
      console.error("Failed to pause canary deployment", err);
    } finally {
      setIsCanaryActionLoading(false);
    }
  }, [workspaceId, activePrompt]);

  const handleResumeCanary = useCallback(async () => {
    if (!activePrompt) return;
    try {
      setIsCanaryActionLoading(true);
      const canary = await promptService.resumeCanary(workspaceId, activePrompt._id);
      setActiveCanary(canary);
    } catch (err) {
      console.error("Failed to resume canary deployment", err);
    } finally {
      setIsCanaryActionLoading(false);
    }
  }, [workspaceId, activePrompt]);

  const handleRollbackCanary = useCallback(async () => {
    if (!activePrompt) return;
    try {
      setIsCanaryActionLoading(true);
      const canary = await promptService.rollbackCanary(workspaceId, activePrompt._id, "Manual rollback from Playground UI");
      setActiveCanary(canary);
      await loadPromptDetails(activePrompt._id, selectedVersionNum);
    } catch (err) {
      console.error("Failed to rollback canary deployment", err);
    } finally {
      setIsCanaryActionLoading(false);
    }
  }, [workspaceId, activePrompt, selectedVersionNum, loadPromptDetails]);

  const handleCompleteCanary = useCallback(async () => {
    if (!activePrompt) return;
    try {
      setIsCanaryActionLoading(true);
      const canary = await promptService.completeCanary(workspaceId, activePrompt._id);
      setActiveCanary(canary);
      await loadPromptDetails(activePrompt._id, selectedVersionNum);
    } catch (err) {
      console.error("Failed to complete canary deployment", err);
    } finally {
      setIsCanaryActionLoading(false);
    }
  }, [workspaceId, activePrompt, selectedVersionNum, loadPromptDetails]);

  return {
    folders,
    prompts,
    searchQuery,
    setSearchQuery,
    expandedFolders,
    setExpandedFolders,
    isLoadingLibrary,
    selectedPromptId,
    setSelectedPromptId,
    activePrompt,
    setActivePrompt,
    versionsList,
    setVersionsList,
    selectedVersionNum,
    setSelectedVersionNum,
    activeCanary,
    isDeployModalOpen,
    setIsDeployModalOpen,
    isCanaryActionLoading,
    handleMoveToStaging,
    handleMoveToDevelopment,
    handleDeployDirect,
    handleStartCanary,
    handleAdvanceCanary,
    handlePauseCanary,
    handleResumeCanary,
    handleRollbackCanary,
    handleCompleteCanary,
    activeTab,
    setActiveTab,
    isEditingPromptContent,
    setIsEditingPromptContent,
    isCreatingNewPrompt,
    setIsCreatingNewPrompt,
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
    previewMode,
    setPreviewMode,
    parameters,
    setParameters,
    isParametersModalOpen,
    setIsParametersModalOpen,
    modalTempParams,
    setModalTempParams,
    savedSnapshot,
    setSavedSnapshot,
    isExecuting,
    setIsExecuting,
    runResult,
    setRunResult,
    executionError,
    setExecutionError,
    isSaving,
    setIsSaving,
    isPublishingProduction,
    handlePublishProduction,
    moveModalPrompt,
    setMoveModalPrompt,
    targetFolderId,
    setTargetFolderId,
    isMoving,
    setIsMoving,
    hasVersionedConfigurationChanged,
    promptsByFolder,
    loadPromptDetails,
  };
}
