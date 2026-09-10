import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Play,
  Copy,
  Check,
  Code2,
  Save,
  Zap,
  AlertCircle,
  FileText,
  Plus,
  Search,
  Folder as FolderIcon,
  FolderOpen,
  X,
  SlidersHorizontal,
  Trash2,
  Settings,
} from "lucide-react";
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

export interface PlaygroundRunItem {
  id: string;
  timestamp: string;
  promptName: string;
  versionNumber?: number;
  variableValues: Record<string, unknown>;
  provider: string;
  modelName: string;
  parameters: PromptParameters;
  resolvedPrompt: string | IPromptMessage[];
  output: string;
  latencyMs: number;
  tokens?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

interface PromptPlaygroundPageProps {
  workspaceId: string;
}

const DEFAULT_PARAMETERS: PromptParameters = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.95,
  responseFormat: "text",
  provider: "gemini",
  modelName: "gemini-3.6-flash",
};

export const PromptPlaygroundPage: React.FC<PromptPlaygroundPageProps> = ({
  workspaceId,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPromptId = searchParams.get("promptId");
  const urlVersionNum = searchParams.get("version");
  const urlIsCreate = searchParams.get("create") === "true";

  // Data State
  const [folders, setFolders] = useState<PromptFolder[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [isLoadingLibrary, setIsLoadingLibrary] = useState<boolean>(true);

  // Active Selection State
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<PromptItem | null>(null);
  const [versionsList, setVersionsList] = useState<PromptVersion[]>([]);
  const [selectedVersionNum, setSelectedVersionNum] = useState<number>(0);

  // Tabs & Editing State
  const [activeTab, setActiveTab] = useState<"prompt" | "versions" | "variables" | "test">("prompt");
  const [isEditingPromptContent, setIsEditingPromptContent] = useState<boolean>(false);
  const [isCreatingNewPrompt, setIsCreatingNewPrompt] = useState<boolean>(false);

  // Working Versioned State (Draft)
  const [editorMode, setEditorMode] = useState<"blocks" | "raw">("blocks");
  const [body, setBody] = useState<string>("");
  const [messages, setMessages] = useState<IPromptMessage[]>([
    { role: "system", content: "You are a senior software developer assistant." },
    { role: "user", content: "Analyze code module {{module_name}} in language {{language}}." },
  ]);

  // Variables Schema & Runtime Test Values (Draft)
  const [variablesSchema, setVariablesSchema] = useState<IPromptVariable[]>([]);
  const [runtimeValues, setRuntimeValues] = useState<Record<string, unknown>>({});
  const [previewMode, setPreviewMode] = useState<"template" | "resolved">("template");

  // Per-Prompt Context-Aware Parameters State
  const [parameters, setParameters] = useState<PromptParameters>(DEFAULT_PARAMETERS);
  const [isParametersModalOpen, setIsParametersModalOpen] = useState<boolean>(false);
  const [modalTempParams, setModalTempParams] = useState<PromptParameters>(DEFAULT_PARAMETERS);

  // Baseline Saved Snapshot for Dirty / Version Difference Checking
  const [savedSnapshot, setSavedSnapshot] = useState<{
    body: string;
    messages: IPromptMessage[];
    variables: IPromptVariable[];
    parameters: PromptParameters;
  } | null>(null);

  // Execution & Output State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<PlaygroundRunItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Save State
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Auto-dismiss notifications
  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
        setSuccessMsg(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  // Load Initial Library Data
  useEffect(() => {
    if (workspaceId) {
      loadLibraryData();
    }
  }, [workspaceId]);

  const loadLibraryData = async () => {
    try {
      setIsLoadingLibrary(true);
      const [foldersList, promptsList] = await Promise.all([
        promptService.listFolders(workspaceId),
        promptService.listPrompts(workspaceId),
      ]);
      setFolders(foldersList);
      setPrompts(promptsList);

      const expMap: Record<string, boolean> = { uncategorized: true };
      foldersList.forEach((f) => {
        expMap[f._id] = true;
      });
      setExpandedFolders(expMap);

      if (urlIsCreate) {
        handleNewPromptImmediate(promptsList);
      } else if (urlPromptId) {
        setSelectedPromptId(urlPromptId);
      } else if (promptsList.length > 0 && !selectedPromptId) {
        setSelectedPromptId(promptsList[0]._id);
      }
    } catch (err) {
      console.error("Failed to load prompt library", err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  // Immediate New Prompt Creation Logic
  const handleNewPromptImmediate = async (existingList?: PromptItem[]) => {
    const list = existingList || prompts;
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const baseName = "New Prompt";
      let targetName = baseName;
      const existingNames = new Set(list.map((p) => p.name));
      if (existingNames.has(targetName)) {
        let count = 1;
        while (existingNames.has(`${baseName} ${count}`)) {
          count++;
        }
        targetName = `${baseName} ${count}`;
      }

      const created = await promptService.createPrompt(workspaceId, {
        name: targetName,
        description: "Created from Prompt Playground",
        category: "general",
        body: "Write your prompt here...",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: "Write your prompt here..." },
        ],
        variables: [],
      });

      const updatedList = await promptService.listPrompts(workspaceId);
      setPrompts(updatedList);
      setSelectedPromptId(created._id);
      setSearchParams({ promptId: created._id });
      setIsEditingPromptContent(true);
      setSuccessMsg(`Created prompt "${created.name}" (No saved version yet)`);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(errorObj.response?.data?.message || errorObj.message || "Failed to create prompt.");
    } finally {
      setIsSaving(false);
    }
  };

  // Synchronize Prompt details when selectedPromptId or version changes
  useEffect(() => {
    if (!workspaceId || !selectedPromptId) return;

    const fetchPromptDetails = async () => {
      try {
        const promptDoc = await promptService.getPromptDetails(workspaceId, selectedPromptId);
        setActivePrompt(promptDoc);

        const versions = await promptService.getPromptVersions(workspaceId, selectedPromptId);
        setVersionsList(versions);

        const targetVerNum = urlVersionNum ? Number(urlVersionNum) : promptDoc.version;
        setSelectedVersionNum(targetVerNum);

        const matchVer = versions.find((v) => v.version === targetVerNum);
        applyPromptVersionDoc(promptDoc, matchVer || null);

        setIsCreatingNewPrompt(false);
      } catch (err) {
        console.error("Failed to fetch prompt details", err);
        setSelectedPromptId(null);
        setActivePrompt(null);
        setSearchParams({});
      }
    };

    fetchPromptDetails();
  }, [selectedPromptId, urlVersionNum, workspaceId]);

  // Apply Prompt Version Data & Baseline Saved Snapshot
  const applyPromptVersionDoc = (prompt: PromptItem, verDoc: PromptVersion | null) => {
    const contentBody = verDoc ? verDoc.body : prompt.body || "";
    const contentMsgs = verDoc
      ? verDoc.messages || []
      : prompt.messages && prompt.messages.length > 0
      ? prompt.messages
      : [];
    const schema = verDoc ? verDoc.variables || [] : prompt.variables || [];

    const promptParams: PromptParameters = {
      temperature: verDoc?.parameters?.temperature ?? prompt.parameters?.temperature ?? DEFAULT_PARAMETERS.temperature,
      maxTokens: verDoc?.parameters?.maxTokens ?? prompt.parameters?.maxTokens ?? DEFAULT_PARAMETERS.maxTokens,
      topP: verDoc?.parameters?.topP ?? prompt.parameters?.topP ?? DEFAULT_PARAMETERS.topP,
      responseFormat: verDoc?.parameters?.responseFormat ?? prompt.parameters?.responseFormat ?? DEFAULT_PARAMETERS.responseFormat,
      provider: verDoc?.provider ?? prompt.provider ?? DEFAULT_PARAMETERS.provider,
      modelName: verDoc?.modelName ?? prompt.modelName ?? DEFAULT_PARAMETERS.modelName,
    };

    setBody(contentBody);
    setMessages(contentMsgs);
    setVariablesSchema(schema);
    setParameters(promptParams);
    setEditorMode(contentMsgs.length > 0 ? "blocks" : "raw");

    // Save baseline snapshot for version difference checking
    setSavedSnapshot({
      body: contentBody,
      messages: contentMsgs,
      variables: schema,
      parameters: promptParams,
    });

    const detectedNames = extractHandlebarsVariables(contentBody, contentMsgs);
    const schemaMap = new Map(schema.map((v) => [v.name, v]));

    setRuntimeValues((prevValues) => {
      const nextValues: Record<string, unknown> = {};
      detectedNames.forEach((varName) => {
        if (prevValues[varName] !== undefined && prevValues[varName] !== "") {
          nextValues[varName] = prevValues[varName];
        } else {
          const varSchema = schemaMap.get(varName);
          nextValues[varName] = varSchema?.defaultValue ?? "";
        }
      });
      return nextValues;
    });
  };

  // Version change handler
  const handleVersionChange = (verNum: number) => {
    setSelectedVersionNum(verNum);
    setSearchParams({ promptId: selectedPromptId || "", version: String(verNum) });
    if (!activePrompt) return;
    const matchVer = versionsList.find((v) => v.version === verNum);
    applyPromptVersionDoc(activePrompt, matchVer || null);
  };

  // Handlebars regex variable detector
  const extractHandlebarsVariables = (b: string, msgs: IPromptMessage[]): string[] => {
    const combined = msgs.length > 0 ? msgs.map((m) => m.content).join("\n") : b;
    const regex = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
    const set = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(combined)) !== null) {
      if (match[1]) {
        set.add(match[1].trim());
      }
    }
    return Array.from(set);
  };

  const activeDetectedVariables = useMemo(() => {
    return extractHandlebarsVariables(body, messages);
  }, [body, messages]);

  // Sync schema with detected variables
  useEffect(() => {
    setVariablesSchema((prev) => {
      const prevMap = new Map(prev.map((v) => [v.name, v]));
      const updated: IPromptVariable[] = [];

      prev.forEach((v) => {
        if (activeDetectedVariables.includes(v.name)) {
          updated.push(v);
        }
      });

      activeDetectedVariables.forEach((name) => {
        if (!prevMap.has(name)) {
          updated.push({
            name,
            type: "string",
            description: `Variable {{${name}}}`,
            defaultValue: "",
            required: true,
          });
        }
      });

      return updated;
    });
  }, [activeDetectedVariables]);

  // Immediate Dirty / Unsaved State Detector
  const hasVersionedConfigurationChanged = useMemo(() => {
    if (!savedSnapshot) return false;

    // Check body or messages
    if (editorMode === "blocks") {
      if (JSON.stringify(messages) !== JSON.stringify(savedSnapshot.messages)) return true;
    } else {
      if (body !== savedSnapshot.body) return true;
    }

    // Check variables
    if (JSON.stringify(variablesSchema) !== JSON.stringify(savedSnapshot.variables)) return true;

    // Check parameters, provider & model
    if (JSON.stringify(parameters) !== JSON.stringify(savedSnapshot.parameters)) return true;

    return false;
  }, [savedSnapshot, body, messages, variablesSchema, parameters, editorMode]);

  // Compute resolved preview
  const resolvedPreview = useMemo(() => {
    if (messages.length > 0) {
      return messages.map((m) => {
        let content = m.content;
        activeDetectedVariables.forEach((vKey) => {
          const val = runtimeValues[vKey] ?? "";
          const regex = new RegExp(`\\{\\{\\s*${vKey}\\s*\\}\\}`, "g");
          content = content.replace(regex, String(val));
        });
        return { ...m, content };
      });
    } else {
      let content = body;
      activeDetectedVariables.forEach((vKey) => {
        const val = runtimeValues[vKey] ?? "";
        const regex = new RegExp(`\\{\\{\\s*${vKey}\\s*\\}\\}`, "g");
        content = content.replace(regex, String(val));
      });
      return content;
    }
  }, [body, messages, activeDetectedVariables, runtimeValues]);

  // Filter prompts by search
  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const q = searchQuery.toLowerCase();
    return prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q)),
    );
  }, [prompts, searchQuery]);

  // Group prompts by folder
  const promptsByFolder = useMemo(() => {
    const map: Record<string, PromptItem[]> = { uncategorized: [] };
    folders.forEach((f) => {
      map[f._id] = [];
    });
    filteredPrompts.forEach((p) => {
      if (p.folderId && map[p.folderId]) {
        map[p.folderId].push(p);
      } else {
        map.uncategorized.push(p);
      }
    });
    return map;
  }, [folders, filteredPrompts]);

  const handleSelectPrompt = (promptId: string) => {
    setSelectedPromptId(promptId);
    setSearchParams({ promptId });
  };

  // Context-Aware Parameters Modal Handlers
  const handleOpenParametersModal = () => {
    setModalTempParams({ ...parameters });
    setIsParametersModalOpen(true);
  };

  const handleCancelParametersModal = () => {
    setIsParametersModalOpen(false);
  };

  const handleSaveParametersModal = () => {
    setParameters({ ...modalTempParams });
    setIsParametersModalOpen(false);
  };

  // Explicit Save Handler
  const handleSavePrompt = async () => {
    if (!selectedPromptId || !activePrompt) return;

    if (!hasVersionedConfigurationChanged && activePrompt.version > 0) {
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const contentBody =
        editorMode === "blocks"
          ? messages.map((m) => `[${m.role.toUpperCase()}]\n${m.content}`).join("\n\n")
          : body;

      const updated = await promptService.updatePrompt(workspaceId, selectedPromptId, {
        body: contentBody,
        messages: editorMode === "blocks" ? messages : [],
        variables: variablesSchema,
        provider: parameters.provider,
        modelName: parameters.modelName,
        parameters: {
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP,
          responseFormat: parameters.responseFormat,
        },
        changeNote: `Saved prompt version (${new Date().toLocaleTimeString()})`,
      });

      setSuccessMsg(`Saved version v${updated.version} for "${updated.name}"`);
      setIsEditingPromptContent(false);

      const versions = await promptService.getPromptVersions(workspaceId, selectedPromptId);
      setVersionsList(versions);
      const promptDoc = await promptService.getPromptDetails(workspaceId, selectedPromptId);
      setActivePrompt(promptDoc);
      setSelectedVersionNum(promptDoc.version);

      setSavedSnapshot({
        body: contentBody,
        messages: editorMode === "blocks" ? messages : [],
        variables: variablesSchema,
        parameters: { ...parameters },
      });
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(errorObj.response?.data?.message || errorObj.message || "Failed to save prompt changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Run Prompt Execution
  const handleRunPlayground = async () => {
    setErrorMsg(null);

    const missingReq: string[] = [];
    activeDetectedVariables.forEach((varName) => {
      const schemaDef = variablesSchema.find((s) => s.name === varName);
      if (
        schemaDef?.required &&
        (!runtimeValues[varName] || String(runtimeValues[varName]).trim() === "")
      ) {
        missingReq.push(varName);
      }
    });

    if (missingReq.length > 0) {
      setErrorMsg(`Missing required runtime test variable(s): ${missingReq.join(", ")}`);
      return;
    }

    setIsExecuting(true);

    try {
      const res: PlaygroundRunResult = await promptService.runPlayground(workspaceId, {
        promptId: selectedPromptId || undefined,
        versionNumber: selectedVersionNum > 0 ? selectedVersionNum : undefined,
        body,
        messages: messages.length > 0 ? messages : undefined,
        variables: runtimeValues,
        provider: parameters.provider,
        modelName: parameters.modelName,
        parameters: {
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP,
        },
      });

      const newRunItem: PlaygroundRunItem = {
        id: `run-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        promptName: activePrompt ? activePrompt.name : "Playground Session",
        versionNumber: selectedVersionNum,
        variableValues: { ...runtimeValues },
        provider: res.metadata.provider,
        modelName: res.metadata.modelName,
        parameters: { ...parameters },
        resolvedPrompt: res.resolvedPrompt,
        output: res.output,
        latencyMs: res.metadata.latencyMs,
        tokens: {
          inputTokens: res.metadata.inputTokens,
          outputTokens: res.metadata.outputTokens,
          totalTokens: res.metadata.totalTokens,
        },
      };

      setRunHistory((prev) => [newRunItem, ...prev]);
      setSelectedRunId(newRunItem.id);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMsg(
        errorObj.response?.data?.message ||
          errorObj.message ||
          "Failed to execute prompt through AI service provider.",
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const currentActiveRun = useMemo(() => {
    if (!selectedRunId && runHistory.length > 0) return runHistory[0];
    return runHistory.find((r) => r.id === selectedRunId) || runHistory[0] || null;
  }, [runHistory, selectedRunId]);

  const handleCopyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddVariableRow = () => {
    const defaultName = `var_${variablesSchema.length + 1}`;
    setVariablesSchema([
      ...variablesSchema,
      {
        name: defaultName,
        type: "string",
        description: "",
        defaultValue: "",
        required: true,
      },
    ]);
    setRuntimeValues((prev) => ({ ...prev, [defaultName]: "" }));
  };

  const renderLineNumbers = (text: string) => {
    const lines = text.split("\n");
    return lines.map((_, i) => (
      <div key={i} className="text-gray-400 select-none text-right pr-3 font-mono text-xs leading-6">
        {i + 1}
      </div>
    ));
  };

  return (
    <div className="h-full flex flex-col bg-white text-gray-900 font-sans overflow-hidden w-full">
      {/* 1. Page Header */}
      <header className="px-6 py-4 bg-white border-b border-gray-200 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Prompt Playground</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Prompt Playground
          </h1>
          <p className="text-xs text-gray-500 mt-0.5 max-w-2xl">
            Create, test, and refine your prompts. Experiment with variables, compare versions, and evaluate outputs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleOpenParametersModal}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border bg-white text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Parameters</span>
          </button>

          <button
            type="button"
            onClick={() => handleNewPromptImmediate()}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-lg bg-olive-700 hover:bg-olive-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>{isSaving ? "Creating..." : "New Prompt"}</span>
          </button>
        </div>
      </header>

      {/* Notifications */}
      {errorMsg && (
        <div className="px-6 py-2 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800 font-bold">
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 min-h-0 relative flex overflow-hidden w-full">
        {/* LEFT COLUMN: Prompt Navigation (Fixed Width ~280px) */}
        <aside className="w-72 border-r border-gray-200 bg-gray-50/40 flex flex-col shrink-0 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Prompts & Templates
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search prompts or tags..."
                className="w-full bg-white border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-olive-500 focus:ring-1 focus:ring-olive-500 transition"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar text-xs">
            {isLoadingLibrary ? (
              <div className="text-center py-8 text-gray-400 text-xs">
                Loading library...
              </div>
            ) : (
              <div className="space-y-3">
                {/* Folders List */}
                {folders.map((folder) => {
                  const folderPrompts = promptsByFolder[folder._id] || [];
                  const isExpanded = expandedFolders[folder._id] ?? true;

                  return (
                    <div key={folder._id} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedFolders((prev) => ({
                            ...prev,
                            [folder._id]: !prev[folder._id],
                          }))
                        }
                        className="w-full text-left px-2 py-1 rounded hover:bg-gray-100/70 text-gray-600 font-semibold text-[11px] uppercase tracking-wider flex items-center justify-between transition cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          {isExpanded ? (
                            <FolderOpen className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                          ) : (
                            <FolderIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          )}
                          <span className="truncate">{folder.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-mono text-gray-500 bg-gray-200/60 px-1.5 py-0.2 rounded">
                            {folderPrompts.length}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="space-y-0.5 pl-1">
                          {folderPrompts.length === 0 ? (
                            <div className="px-3 py-1 text-[11px] text-gray-400 italic">
                              No prompts
                            </div>
                          ) : (
                            folderPrompts.map((p) => {
                              const isSelected = selectedPromptId === p._id;
                              return (
                                <div
                                  key={p._id}
                                  onClick={() => handleSelectPrompt(p._id)}
                                  className={`w-full text-left px-2.5 py-2 rounded-lg transition group cursor-pointer border ${
                                    isSelected
                                      ? "bg-olive-50/80 border-olive-300/80 text-olive-950 font-medium"
                                      : "border-transparent text-gray-700 hover:bg-gray-100/80"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-olive-700" : "text-gray-400"}`} />
                                      <span className="truncate text-xs font-semibold">{p.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                      {p.version > 0 ? `v${p.version}` : "Draft"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-gray-500 truncate mt-0.5 pl-5">
                                    {p.description || "Created from Prompt Library"}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* All Prompts */}
                <div className="space-y-0.5 pt-2 border-t border-gray-200">
                  <div className="px-2 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                    <span>ALL PROMPTS</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {(promptsByFolder.uncategorized || []).length}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    {(promptsByFolder.uncategorized || []).map((p) => {
                      const isSelected = selectedPromptId === p._id;
                      return (
                        <div
                          key={p._id}
                          onClick={() => handleSelectPrompt(p._id)}
                          className={`w-full text-left px-2.5 py-2 rounded-lg transition group cursor-pointer border ${
                            isSelected
                              ? "bg-olive-50/80 border-olive-300/80 text-olive-950 font-medium"
                              : "border-transparent text-gray-700 hover:bg-gray-100/80"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-olive-700" : "text-gray-400"}`} />
                              <span className="truncate text-xs font-semibold">{p.name}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {p.version > 0 ? `v${p.version}` : "Draft"}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 truncate mt-0.5 pl-5">
                            {p.description || "Created from Prompt Library"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* RIGHT COLUMN: Main Prompt Workspace */}
        <main className="flex-1 min-w-0 w-full flex flex-col h-full overflow-y-auto custom-scrollbar p-6 space-y-6 bg-white">
          {!selectedPromptId && !isCreatingNewPrompt ? (
            /* Empty State */
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
                onClick={() => handleNewPromptImmediate()}
                className="px-4 py-2 rounded-lg bg-olive-700 hover:bg-olive-800 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create New Prompt
              </button>
            </div>
          ) : (
            /* Active Prompt Workspace */
            <div className="space-y-6 w-full">
              {/* Prompt Header */}
              <div className="p-4 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs w-full">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-700 shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">
                        {activePrompt?.name || "New Prompt"}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200">
                        {selectedVersionNum > 0 ? `v${selectedVersionNum}` : "No saved version yet"}
                      </span>
                      {hasVersionedConfigurationChanged ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          Unsaved changes
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Saved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Created from Prompt Library • Last updated just now
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleSavePrompt}
                    disabled={isSaving || (!hasVersionedConfigurationChanged && selectedVersionNum > 0)}
                    className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                      hasVersionedConfigurationChanged || selectedVersionNum === 0
                        ? "bg-olive-700 hover:bg-olive-800 text-white shadow-2xs"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditingPromptContent(!isEditingPromptContent)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Code2 className="w-3.5 h-3.5 text-gray-500" />
                    {isEditingPromptContent ? "Done Editing" : "Edit Structure"}
                  </button>
                </div>
              </div>

              {/* Tabs Navigation */}
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
                  Variables ({activeDetectedVariables.length})
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
                  Test & Output
                </button>
              </div>

              {/* 1. VERSIONS TAB: Strictly renders ONLY the versions list */}
              {activeTab === "versions" && (
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 w-full">
                  <div className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    Prompt Version History
                  </div>
                  {versionsList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-gray-200 rounded-lg">
                      No saved versions yet. Make changes and click "Save" to record Version 1.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {versionsList.map((v) => (
                        <div
                          key={v.version}
                          onClick={() => handleVersionChange(v.version)}
                          className={`py-3 px-3 rounded-lg flex items-center justify-between cursor-pointer transition ${
                            v.version === selectedVersionNum
                              ? "bg-olive-50 text-olive-900 font-semibold"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                              v{v.version}
                            </span>
                            <span className="text-xs">{v.changeNote || `Version ${v.version}`}</span>
                          </div>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {new Date(v.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. PROMPT TAB: Prompt Content & Structure Editor */}
              {activeTab === "prompt" && (
                <div className="space-y-6 w-full">
                  {/* Inline Editor Drawer (if Edit Structure clicked) */}
                  {isEditingPromptContent && (
                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-3 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                          Edit Structure & Prompt Body
                        </span>
                        <div className="flex items-center gap-1 bg-white border border-gray-200 p-0.5 rounded-md">
                          <button
                            type="button"
                            onClick={() => setEditorMode("blocks")}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                              editorMode === "blocks"
                                ? "bg-gray-100 text-gray-900 font-bold"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            Messages
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorMode("raw")}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                              editorMode === "raw"
                                ? "bg-gray-100 text-gray-900 font-bold"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            Raw Body
                          </button>
                        </div>
                      </div>

                      {editorMode === "blocks" ? (
                        <div className="space-y-2">
                          {messages.map((msg, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-white border border-gray-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <select
                                  value={msg.role}
                                  onChange={(e) => {
                                    const updated = [...messages];
                                    updated[idx].role = e.target.value as IPromptMessage["role"];
                                    setMessages(updated);
                                  }}
                                  className="bg-gray-50 border border-gray-200 text-gray-900 font-bold text-xs rounded px-2 py-0.5 uppercase"
                                >
                                  <option value="system">SYSTEM</option>
                                  <option value="user">USER</option>
                                  <option value="assistant">ASSISTANT</option>
                                </select>
                                {messages.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setMessages(messages.filter((_, i) => i !== idx))}
                                    className="text-gray-400 hover:text-rose-600 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <textarea
                                value={msg.content}
                                onChange={(e) => {
                                  const updated = [...messages];
                                  updated[idx].content = e.target.value;
                                  setMessages(updated);
                                }}
                                placeholder={`Enter ${msg.role} message...`}
                                rows={3}
                                className="w-full bg-white border border-gray-200 rounded p-2.5 text-xs font-mono text-gray-900 focus:outline-none focus:border-olive-500"
                              />
                            </div>
                          ))}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setMessages([...messages, { role: "user", content: "" }])}
                              className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
                            >
                              + User Message
                            </button>
                            <button
                              type="button"
                              onClick={() => setMessages([...messages, { role: "assistant", content: "" }])}
                              className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50"
                            >
                              + Assistant Message
                            </button>
                          </div>
                        </div>
                      ) : (
                        <textarea
                          value={body}
                          onChange={(e) => setBody(e.target.value)}
                          placeholder="Write your prompt content..."
                          rows={6}
                          className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs font-mono text-gray-900 focus:outline-none focus:border-olive-500"
                        />
                      )}

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingPromptContent(false)}
                          className="px-3 py-1.5 rounded text-xs font-medium text-gray-600 hover:bg-gray-100"
                        >
                          Done Editing
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Prompt Content Preview View */}
                  <div className="space-y-2 w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <span>Prompt Content</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                          <button
                            type="button"
                            onClick={() => setPreviewMode("template")}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                              previewMode === "template"
                                ? "bg-white text-gray-900 shadow-2xs font-semibold"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            Template View
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewMode("resolved")}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition cursor-pointer ${
                              previewMode === "resolved"
                                ? "bg-white text-gray-900 shadow-2xs font-semibold"
                                : "text-gray-500 hover:text-gray-900"
                            }`}
                          >
                            Resolved View
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50/30 overflow-hidden flex flex-col w-full">
                      <div className="p-3 bg-white border-b border-gray-200 text-xs font-mono flex w-full">
                        <div className="w-8 shrink-0 border-r border-gray-100 pr-2">
                          {previewMode === "template"
                            ? renderLineNumbers(messages.length > 0 ? messages.map((m) => `[${m.role}]\n${m.content}`).join("\n\n") : body)
                            : renderLineNumbers(Array.isArray(resolvedPreview) ? resolvedPreview.map((m) => `[${m.role}]\n${m.content}`).join("\n\n") : resolvedPreview)}
                        </div>
                        <div className="flex-1 min-w-0 pl-3 text-gray-800 leading-6 whitespace-pre-wrap font-mono">
                          {previewMode === "template" ? (
                            messages.length > 0 ? (
                              messages.map((m, idx) => (
                                <div key={idx} className="mb-2">
                                  <span className="text-olive-700 font-bold font-sans text-[11px] block uppercase">
                                    [{m.role}]
                                  </span>
                                  <span>{m.content}</span>
                                </div>
                              ))
                            ) : (
                              <span>{body}</span>
                            )
                          ) : Array.isArray(resolvedPreview) ? (
                            resolvedPreview.map((m, idx) => (
                              <div key={idx} className="mb-2">
                                <span className="text-amber-700 font-bold font-sans text-[11px] block uppercase">
                                  [{m.role}]
                                </span>
                                <span>{m.content}</span>
                              </div>
                            ))
                          ) : (
                            <span>{resolvedPreview}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. VARIABLES TAB: Renders ONLY the Variables table */}
              {activeTab === "variables" && (
                <div className="space-y-3 w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Variables
                      </h3>
                      <p className="text-xs text-gray-500">
                        Add variables to make your prompt dynamic
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddVariableRow}
                      className="px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Variable
                    </button>
                  </div>

                  {activeDetectedVariables.length === 0 && variablesSchema.length === 0 ? (
                    <div className="p-6 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-center space-y-1 w-full">
                      <div className="text-xs font-semibold text-gray-700">No variables yet</div>
                      <p className="text-xs text-gray-500">
                        Create variables to use in your prompt. They will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg overflow-hidden w-full">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold text-[11px] uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5">Variable</th>
                            <th className="px-4 py-2.5">Type</th>
                            <th className="px-4 py-2.5">Test Value</th>
                            <th className="px-4 py-2.5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {variablesSchema.map((v) => {
                            const testVal = (runtimeValues[v.name] as string | number | undefined) ?? "";
                            return (
                              <tr key={v.name} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2.5 font-mono font-semibold text-gray-900">
                                  {`{{${v.name}}}`}
                                </td>
                                <td className="px-4 py-2.5 text-gray-500 uppercase font-mono text-[11px]">
                                  {v.type}
                                </td>
                                <td className="px-4 py-2.5">
                                  <input
                                    type="text"
                                    value={testVal}
                                    onChange={(e) =>
                                      setRuntimeValues({ ...runtimeValues, [v.name]: e.target.value })
                                    }
                                    placeholder={`Enter test value...`}
                                    className="w-full max-w-md bg-white border border-gray-200 rounded px-2.5 py-1 text-xs font-mono text-gray-900 focus:outline-none focus:border-olive-500"
                                  />
                                </td>
                                <td className="px-4 py-2.5 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setVariablesSchema(variablesSchema.filter((x) => x.name !== v.name))
                                    }
                                    className="text-gray-400 hover:text-rose-600 transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 4. TEST & OUTPUT TAB: Model Selector & Run Bar + Execution Result Output */}
              {activeTab === "test" && (
                <div className="space-y-6 w-full">
                  {/* Model Configuration & Run Prompt Action Bar */}
                  <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/40 flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <span className="text-xs font-semibold text-gray-700">Model</span>
                      <select
                        value={parameters.modelName}
                        onChange={(e) => setParameters({ ...parameters, modelName: e.target.value })}
                        className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none focus:border-olive-500 cursor-pointer shadow-2xs"
                      >
                        <option value="gemini-3.6-flash">Google Gemini 3.6 Flash</option>
                        <option value="gpt-4o">OpenAI GPT-4o</option>
                        <option value="claude-3-5-sonnet-20240620">Anthropic Claude 3.5 Sonnet</option>
                      </select>

                      <button
                        type="button"
                        onClick={handleOpenParametersModal}
                        className="p-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 transition cursor-pointer"
                        title="Open Parameters Modal"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleRunPlayground}
                      disabled={isExecuting}
                      className="w-full sm:w-auto px-6 py-2 rounded-lg bg-olive-700 hover:bg-olive-800 disabled:opacity-50 text-white font-bold text-xs shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isExecuting ? (
                        <>
                          <Zap className="w-3.5 h-3.5 animate-spin text-amber-300" />
                          Running Prompt...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current text-emerald-300" />
                          Run Prompt
                        </>
                      )}
                    </button>
                  </div>

                  {/* Execution Result Section */}
                  <div className="space-y-3 pt-2 w-full">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Execution Result
                      </h3>

                      {currentActiveRun && (
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                          <span>{currentActiveRun.latencyMs} ms</span>
                          <span>•</span>
                          <span>{currentActiveRun.tokens?.totalTokens || 0} tokens</span>
                          <button
                            type="button"
                            onClick={() => handleCopyOutput(currentActiveRun.output)}
                            className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-sans font-semibold flex items-center gap-1 transition cursor-pointer"
                          >
                            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            {copied ? "Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>

                    {isExecuting ? (
                      <div className="p-8 rounded-lg border border-gray-200 bg-white text-center space-y-2 w-full">
                        <Zap className="w-6 h-6 animate-bounce text-olive-700 mx-auto" />
                        <div className="text-xs font-bold text-gray-900">Executing Prompt...</div>
                        <p className="text-xs text-gray-500">
                          Generating output using {parameters.modelName}...
                        </p>
                      </div>
                    ) : currentActiveRun ? (
                      <div className="p-4 rounded-lg border border-gray-200 bg-white font-mono text-xs text-gray-900 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto custom-scrollbar w-full">
                        {currentActiveRun.output}
                      </div>
                    ) : (
                      <div className="p-8 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-center space-y-1 w-full">
                        <div className="text-xs font-semibold text-gray-700">No execution run yet</div>
                        <p className="text-xs text-gray-500">
                          Enter runtime values and click "Run Prompt" to generate an output.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* 4. Context-Aware Parameters Modal */}
      {isParametersModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900">Prompt Parameters</h3>
              <button
                type="button"
                onClick={handleCancelParametersModal}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-900 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Temperature
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={modalTempParams.temperature}
                    onChange={(e) =>
                      setModalTempParams({
                        ...modalTempParams,
                        temperature: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1 accent-olive-700 cursor-pointer"
                  />
                  <span className="w-12 font-mono text-right text-gray-900 font-semibold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {modalTempParams.temperature}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={modalTempParams.maxTokens}
                  onChange={(e) =>
                    setModalTempParams({
                      ...modalTempParams,
                      maxTokens: parseInt(e.target.value, 10) || 100,
                    })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 font-mono text-gray-900 focus:outline-none focus:border-olive-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Top P
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={modalTempParams.topP}
                    onChange={(e) =>
                      setModalTempParams({
                        ...modalTempParams,
                        topP: parseFloat(e.target.value),
                      })
                    }
                    className="flex-1 accent-olive-700 cursor-pointer"
                  />
                  <span className="w-12 font-mono text-right text-gray-900 font-semibold bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {modalTempParams.topP}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Response Format
                </label>
                <select
                  value={modalTempParams.responseFormat}
                  onChange={(e) =>
                    setModalTempParams({
                      ...modalTempParams,
                      responseFormat: e.target.value as "text" | "json",
                    })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-olive-500 cursor-pointer"
                >
                  <option value="text">Text</option>
                  <option value="json">JSON Object</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Provider
                </label>
                <select
                  value={modalTempParams.provider}
                  onChange={(e) =>
                    setModalTempParams({
                      ...modalTempParams,
                      provider: e.target.value,
                    })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-900 focus:outline-none focus:border-olive-500 cursor-pointer"
                >
                  <option value="gemini">Google Gemini AI</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50/50">
              <button
                type="button"
                onClick={handleCancelParametersModal}
                className="px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveParametersModal}
                className="px-4 py-1.5 rounded-lg bg-olive-700 hover:bg-olive-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptPlaygroundPage;
