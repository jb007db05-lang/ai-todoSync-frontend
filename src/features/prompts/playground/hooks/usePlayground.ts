import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  promptService,
  PromptItem,
  PromptVersion,
  PromptFolder,
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
        const [promptData, versionsData] = await Promise.all([
          promptService.getPrompt(workspaceId, promptId),
          promptService.listVersions(workspaceId, promptId),
        ]);

        setActivePrompt(promptData);
        setVersionsList(versionsData);

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
