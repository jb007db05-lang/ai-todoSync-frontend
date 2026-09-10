import React, { useState, useEffect } from "react";
import {
  centralizedAiService,
  AIProjectPlanResponse,
  AIPlanModificationResponse,
  WorkspaceSessionItem,
} from "@/services/centralizedAi";
import {
  Sparkles,
  Check,
  X,
  Plus,
  Edit3,
  BookOpen,
  MessageSquare,
  History,
  Copy,
  AlertCircle,
  FolderPlus,
  Trash2,
} from "lucide-react";

interface PlanningSessionItem {
  id: string;
  title: string;
  createdAt: string;
  plan?: AIProjectPlanResponse | null;
  messages?: Array<{ role: "user" | "ai"; content: string }>;
}

interface AiProjectPlanModalProps {
  isOpen: boolean;
  workspaceId?: string;
  onClose: () => void;
  onProjectCreated: (project: unknown) => void;
}

export const AiProjectPlanModal: React.FC<AiProjectPlanModalProps> = ({
  isOpen,
  workspaceId,
  onClose,
  onProjectCreated,
}) => {
  // Session History State
  const [sessions, setSessions] = useState<PlanningSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Conversation Stream State
  const [, setChatMessages] = useState<
    Array<{ role: "user" | "ai"; content: string; plan?: AIProjectPlanResponse; delta?: Record<string, unknown> }>
  >([]);
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [modifying, setModifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [error, setError] = useState("");

  const [generatedPlan, setGeneratedPlan] = useState<AIProjectPlanResponse | null>(null);
  const [changeRequest, setChangeRequest] = useState("");
  const [lastDelta, setLastDelta] = useState<AIPlanModificationResponse["delta"] | null>(null);

  // Tabs: 'chat' | 'artifacts'
  const [activeMainTab, setActiveMainTab] = useState<"chat" | "artifacts">("chat");
  const [activeBlueprintSubTab, setActiveBlueprintSubTab] = useState<"blueprint" | "features" | "risks" | "timeline">("blueprint");

  // Selected Artifact State
  const [selectedArtifactType, setSelectedArtifactType] = useState<"project_plan" | "prd" | "tech_spec" | "timeline" | "risks">("project_plan");

  // Saved Workspace Artifacts
  const [savedWorkspacePlans, setSavedWorkspacePlans] = useState<Record<string, unknown>[]>([]);
  const [copiedText, setCopiedText] = useState(false);

  // Model Selector State
  const [selectedProvider, setSelectedProvider] = useState<"gemini" | "openai" | "anthropic">("gemini");
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.6-flash");

  useEffect(() => {
    if (isOpen) {
      void loadSessionsAndWorkspacePlans();
    }
  }, [isOpen, workspaceId]);

  const loadSessionsAndWorkspacePlans = async () => {
    try {
      const [historySessions, plans] = await Promise.all([
        centralizedAiService.listWorkspaceSessions(workspaceId),
        centralizedAiService.listWorkspacePlans(workspaceId),
      ]);
      setSavedWorkspacePlans(plans);

      if (historySessions && historySessions.length > 0) {
        const formattedSessions = historySessions.map((s: WorkspaceSessionItem) => ({
          id: s.id,
          title: s.title || "Planning Session",
          createdAt: s.createdAt ? new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent",
        }));
        setSessions(formattedSessions);
        // Load the most recent session
        void handleSelectSession(formattedSessions[0]);
      } else {
        // Only if user has zero sessions, create the initial session
        void startNewSession();
      }
    } catch (err) {
      console.error("Failed to load workspace AI sessions/plans", err);
    }
  };

  const startNewSession = async () => {
    const defaultTitle = "New Planning Session";
    setError("");

    try {
      const backendSession = await centralizedAiService.createWorkspaceSession(workspaceId, defaultTitle);
      if (backendSession && backendSession.id) {
        const newSessItem: PlanningSessionItem = {
          id: backendSession.id,
          title: backendSession.title || defaultTitle,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setSessions((prev) => [newSessItem, ...prev.filter((s) => s.id !== backendSession.id)]);
        setActiveSessionId(backendSession.id);
        setChatMessages([]);
        setGeneratedPlan(null);
        setLastDelta(null);
        setPrompt("");
        setContext("");
      }
    } catch (err) {
      console.warn("Failed to create new session", err);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await centralizedAiService.deleteWorkspaceSession(workspaceId, sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          void handleSelectSession(remaining[0]);
        } else {
          void startNewSession();
        }
      }
    } catch (err) {
      console.error("Failed to delete session", err);
    }
  };

  const handleSelectSession = async (sess: PlanningSessionItem) => {
    setActiveSessionId(sess.id);
    setError("");
    try {
      const detail = await centralizedAiService.getWorkspaceSession(workspaceId, sess.id);
      if (detail && detail.messages && detail.messages.length > 0) {
        setChatMessages(
          detail.messages.map((m: { role: string; content: string; metadata?: { plan?: AIProjectPlanResponse; delta?: AIPlanModificationResponse["delta"] } }) => ({
            role: m.role === "USER" ? "user" : "ai",
            content: m.content,
            plan: m.metadata?.plan,
            delta: m.metadata?.delta,
          })),
        );
      } else {
        setChatMessages([]);
      }

      if (detail && detail.drafts && detail.drafts.length > 0) {
        const latestDraft = detail.drafts[0];
        if (latestDraft.plan) {
          setGeneratedPlan(latestDraft.plan);
        }
      } else {
        setGeneratedPlan(null);
      }
    } catch (err) {
      console.error("Failed to fetch session detail", err);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setError("");

    const userMsg = prompt;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    try {
      const plan = await centralizedAiService.generateProjectPlan(
        prompt,
        context,
        activeSessionId,
        workspaceId,
        selectedProvider,
        selectedModel,
      );
      setGeneratedPlan(plan);
      setLastDelta(null);

      // Auto-title session
      const title = plan.name || prompt.slice(0, 32);
      setSessions((prev) =>
        prev.map((s) => (s.id === activeSessionId ? { ...s, title, plan } : s)),
      );

      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Generated complete technical implementation blueprint for **${plan.name}**. System goal: ${plan.systemGoal || plan.description}`,
          plan,
        },
      ]);
      setPrompt("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setError(errorObj.response?.data?.error || errorObj.message || "Failed to generate project plan");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatedPlan || !changeRequest.trim()) return;
    setModifying(true);
    setError("");

    const reqMsg = changeRequest;
    setChatMessages((prev) => [...prev, { role: "user", content: `Change Request: ${reqMsg}` }]);

    try {
      const result = await centralizedAiService.modifyProjectPlan(
        generatedPlan,
        changeRequest,
        activeSessionId,
        workspaceId,
        selectedProvider,
        selectedModel,
      );
      setGeneratedPlan(result.updatedPlan);
      setLastDelta(result.delta);

      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Plan updated cleanly: ${result.delta.summary}`,
          plan: result.updatedPlan,
          delta: result.delta,
        },
      ]);
      setChangeRequest("");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setError(errorObj.response?.data?.error || errorObj.message || "Failed to update project plan");
    } finally {
      setModifying(false);
    }
  };

  const handleConfirmPlanExecution = async () => {
    if (!generatedPlan) return;
    setConfirming(true);
    setError("");
    try {
      const project = await centralizedAiService.confirmProjectPlan(workspaceId || null, generatedPlan);
      setShowApprovalDialog(false);
      onProjectCreated(project);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } }; message?: string };
      setError(errorObj.response?.data?.error || errorObj.message || "Failed to materialize project");
    } finally {
      setConfirming(false);
    }
  };

  const copyArtifactToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1000] p-4 overflow-y-auto">
      <div className="bg-slate-950/95 border border-slate-800/90 rounded-2xl w-full max-w-5xl h-[90vh] flex shadow-2xl shadow-black/80 overflow-hidden text-slate-100 backdrop-blur-xl animate-modalIn">
        {/* Left History Sidebar */}
        <div className="w-64 border-r border-slate-800/80 bg-slate-950/80 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-emerald-400" />
                <span>Conversation History</span>
              </span>
            </div>

            {/* New Chat Button */}
            <button
              onClick={startNewSession}
              className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Planning Chat</span>
            </button>

            {/* Sessions List */}
            <div className="space-y-1.5 pt-2">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => handleSelectSession(sess)}
                  className={`w-full group flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    sess.id === activeSessionId
                      ? "bg-slate-800/90 border-emerald-500/50 text-emerald-300 font-semibold shadow-inner"
                      : "bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/40 hover:text-white"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="truncate font-medium text-slate-200">{sess.title}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{sess.createdAt}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    title="Delete Session"
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between font-medium">
            <span>Workspace AI Planner</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col bg-slate-900/70 overflow-hidden">
          {/* Header & Main Tabs */}
          <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">AI Project Architect & Master Planner</h3>
                <p className="text-xs text-slate-400">Transform high-level system ideas into reviewable blueprints & PRDs</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Model Selector Dropdown */}
              <div className="flex items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 shadow-inner space-x-2 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-300 hidden sm:inline">Model:</span>
                <select
                  value={`${selectedProvider}:${selectedModel}`}
                  onChange={(e) => {
                    const [p, m] = e.target.value.split(":");
                    setSelectedProvider(p as "gemini" | "openai" | "anthropic");
                    setSelectedModel(m);
                  }}
                  className="bg-transparent text-slate-100 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="gemini:gemini-3.6-flash" className="bg-slate-900 text-slate-100">✨ Google Gemini 3.6 Flash (Default)</option>
                  <option value="gemini:gemini-2.5-pro" className="bg-slate-900 text-slate-100">🧠 Google Gemini 2.5 Pro</option>
                  <option value="openai:gpt-4o" className="bg-slate-900 text-slate-100">🚀 OpenAI GPT-4o</option>
                  <option value="openai:gpt-4o-mini" className="bg-slate-900 text-slate-100">⚡ OpenAI GPT-4o Mini</option>
                  <option value="anthropic:claude-3-5-sonnet" className="bg-slate-900 text-slate-100">🎭 Anthropic Claude 3.5 Sonnet</option>
                </select>
              </div>

              {/* Main Tabs: Chat vs Artifacts */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 space-x-1">
                <button
                  onClick={() => setActiveMainTab("chat")}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeMainTab === "chat"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Planner Chat</span>
                </button>
                <button
                  onClick={() => setActiveMainTab("artifacts")}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeMainTab === "artifacts"
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Artifacts & PRDs ({generatedPlan ? 1 + savedWorkspacePlans.length : savedWorkspacePlans.length})</span>
                </button>
              </div>

              <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          {activeMainTab === "chat" ? (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {error && (
                <div className="p-3.5 bg-rose-950/40 border border-rose-800/80 text-rose-200 rounded-xl text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center space-x-2 font-bold text-rose-300">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {(error.includes("429") || error.includes("quota") || error.includes("RESOURCE_EXHAUSTED")) && (
                    <div className="pt-1.5 text-[11px] text-rose-300/80 border-t border-rose-800/60 flex items-center justify-between">
                      <span>💡 Quota limit reached on {selectedModel}. Switch to another AI Model using the dropdown in the top header above!</span>
                    </div>
                  )}
                </div>
              )}

              {!generatedPlan ? (
                /* System Prompt Input */
                <form onSubmit={handleGenerate} className="space-y-5 max-w-2xl mx-auto pt-6">
                  <div className="text-center space-y-2 mb-6">
                    <h4 className="text-xl font-bold text-white tracking-tight">Describe Your System or Product Idea</h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-lg mx-auto">Describe the basic workflow in simple language. The AI will decompose actors, system modules, feature specs, effort, and risks without writing source code.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      High-Level System Requirement
                    </label>
                    <textarea
                      rows={5}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. I want to build a SaaS CRM where sales reps manage leads and opportunities, managers monitor team pipelines and metrics, and admins configure user permissions."
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 leading-relaxed font-sans transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Technical Stack / Constraints (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="e.g. Stack: Node, React, Mongoose. Target: Launch MVP in 6 weeks."
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/40 transition"
                    />
                  </div>

                  {loading && (
                    <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3 shadow-inner">
                      <div className="flex items-center space-x-3 text-white font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                        <span>AI Architect is synthesizing your technical blueprint...</span>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                          <span>Decomposing user workflows, actors, permissions, and core modules</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
                          <span>Generating frontend, backend, database schema & API specifications</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                          <span>Estimating engineering effort, risk mitigations & milestone roadmap</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-400 italic">
                        Detailed production engineering blueprints take ~30–60 seconds to synthesize.
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-xl shadow-emerald-950/60 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{loading ? "Synthesizing Architecture..." : "Synthesize Technical Plan & PRD"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Generated Plan Interactive Workspace */
                <div className="space-y-6">
                  {/* Top Action Ribbon */}
                  <div className="p-4 bg-slate-950/90 border border-emerald-500/40 rounded-2xl flex items-center justify-between shadow-xl">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-bold text-white">{generatedPlan.name}</h4>
                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                          BLUEPRINT SYNTHESIZED
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{generatedPlan.description}</p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <button
                        onClick={() => setShowApprovalDialog(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 transition flex items-center space-x-2"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>Materialize Project Structure</span>
                      </button>
                    </div>
                  </div>

                  {/* Delta Notification Callout */}
                  {lastDelta && (
                    <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/80 text-emerald-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-emerald-300 flex items-center space-x-1.5">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Modification Applied cleanly:</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{lastDelta.summary}</p>
                    </div>
                  )}

                  {/* Sub-Tabs for Blueprint Sections */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex space-x-2">
                      {(["blueprint", "features", "risks", "timeline"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveBlueprintSubTab(tab)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                            activeBlueprintSubTab === tab
                              ? "bg-slate-800 text-emerald-300 border border-slate-700"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Estimated Timeline: {generatedPlan.timeline?.estimatedCalendarWeeks || 4} Weeks
                    </span>
                  </div>

                  {/* Sub-Tab Content Views */}
                  {activeBlueprintSubTab === "blueprint" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
                        <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-emerald-400">System Goal</h5>
                        <p className="text-slate-300 leading-relaxed">{generatedPlan.systemGoal || generatedPlan.description}</p>
                      </div>

                      <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2">
                        <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-emerald-400">Target Tech Stack</h5>
                        <p className="text-slate-300 leading-relaxed font-mono">{generatedPlan.recommendedStack || "React, Node.js, TypeScript, PostgreSQL"}</p>
                      </div>

                      <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-2 md:col-span-2">
                        <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-emerald-400">System Modules & Epic Specs</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {generatedPlan.modules?.map((m, idx) => (
                            <div key={idx} className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                              <div className="font-semibold text-white">{m.name}</div>
                              <div className="text-[11px] text-slate-400">{m.description}</div>
                              {m.features && (
                                <div className="text-[10px] text-slate-500 font-mono pt-1">
                                  Features: {m.features.join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeBlueprintSubTab === "features" && (
                    <div className="space-y-3 text-xs">
                      <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-emerald-400">Synthesized User Tasks & Work Breakdown</h5>
                      <div className="space-y-2">
                        {generatedPlan.tasks?.map((t, idx) => (
                          <div key={idx} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                            <div className="space-y-0.5">
                              <span className="font-semibold text-white">{t.title}</span>
                              <p className="text-[11px] text-slate-400">{t.description}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700">
                              {t.estimatedHours || 4}h
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeBlueprintSubTab === "risks" && (
                    <div className="space-y-3 text-xs">
                      <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-emerald-400">Engineering Risk Assessment</h5>
                      <div className="grid grid-cols-1 gap-2">
                        {generatedPlan.risks?.map((r, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-rose-300">{r.title}</span>
                              <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded text-[10px] font-mono uppercase font-bold">
                                {r.severity || "MEDIUM"}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">Mitigation: {r.mitigation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeBlueprintSubTab === "timeline" && (
                    <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-xs space-y-2">
                      <h5 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] text-emerald-400">Execution Timeline & Milestones</h5>
                      <div className="text-slate-300 space-y-2 pt-1">
                        <div>Estimated Engineering Duration: <span className="font-bold text-white">{generatedPlan.timeline?.estimatedCalendarWeeks || 4} Weeks</span></div>
                        <div className="space-y-1 pt-2">
                          {generatedPlan.timeline?.milestones?.map((m, idx) => (
                            <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded flex justify-between">
                              <span className="font-semibold text-slate-200">{m.name}</span>
                              <span className="text-slate-400 font-mono">{m.targetWeek}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Refinement Change Request Input */}
                  <form onSubmit={handleApplyChangeRequest} className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Refine / Modify Blueprint</span>
                      </label>
                      <span className="text-[10px] text-slate-500">Ask the AI to add modules, tweak tech stack, adjust effort</span>
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={changeRequest}
                        onChange={(e) => setChangeRequest(e.target.value)}
                        placeholder="e.g. Add a Stripe Payment Integration module and increase high availability effort"
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80"
                      />
                      <button
                        type="submit"
                        disabled={modifying || !changeRequest.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 shrink-0"
                      >
                        {modifying ? "Updating..." : "Apply Edit"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Artifacts Tab View */
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {(["project_plan", "prd", "tech_spec", "timeline", "risks"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedArtifactType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                        selectedArtifactType === type
                          ? "bg-emerald-600 text-white shadow"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      {type.replace("_", " ")}
                    </button>
                  ))}
                </div>

                {generatedPlan && (
                  <button
                    onClick={() => copyArtifactToClipboard(JSON.stringify(generatedPlan, null, 2))}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedText ? "Copied JSON!" : "Copy JSON Schema"}</span>
                  </button>
                )}
              </div>

              {generatedPlan ? (
                <div className="p-4 bg-slate-950/90 border border-slate-800 rounded-2xl font-mono text-xs text-slate-300 overflow-x-auto max-h-[60vh]">
                  <div className="space-y-4">
                    {selectedArtifactType === "project_plan" && (
                      <pre className="whitespace-pre-wrap font-sans">
                        # Product Blueprint: {generatedPlan.name}
                        {"\n\n"}
                        ## System Description
                        {generatedPlan.description}
                        {"\n\n"}
                        ## Core Goals
                        {generatedPlan.systemGoal}
                        {"\n\n"}
                        ## Modules
                        {generatedPlan.modules?.map((m) => `- **${m.name}**: ${m.description}`).join("\n")}
                      </pre>
                    )}

                    {selectedArtifactType === "prd" && (
                      <pre className="whitespace-pre-wrap font-sans">
                        # Product Requirements Document (PRD)
                        {"\n"}
                        Product Name: {generatedPlan.name}
                        {"\n\n"}
                        1. Executive Summary
                        {generatedPlan.description}
                        {"\n\n"}
                        2. Target Tech Stack
                        {generatedPlan.recommendedStack}
                        {"\n\n"}
                        3. Functional Specs
                        {generatedPlan.modules?.map((m) => `### ${m.name}\n${m.description}`).join("\n\n")}
                      </pre>
                    )}

                    {selectedArtifactType === "tech_spec" && (
                      <pre className="whitespace-pre-wrap font-sans">
                        # Engineering Technical Specification
                        {"\n"}
                        Architecture & Architecture Strategy
                        {"\n\n"}
                        ## Recommended Stack
                        {generatedPlan.recommendedStack}
                        {"\n\n"}
                        ## Task Decomposition ({generatedPlan.tasks?.length || 0} Tasks)
                        {generatedPlan.tasks?.map((t) => `* [${t.estimatedHours || 4}h] ${t.title}: ${t.description}`).join("\n")}
                      </pre>
                    )}

                    {selectedArtifactType === "timeline" && (
                      <pre className="whitespace-pre-wrap font-sans">
                        # Implementation Roadmap
                        {"\n"}
                        Estimated Duration: {generatedPlan.timeline?.estimatedCalendarWeeks || 4} Weeks
                        {"\n\n"}
                        Milestones:
                        {generatedPlan.timeline?.milestones?.map((m) => `- [${m.targetWeek}] ${m.name}`).join("\n")}
                      </pre>
                    )}

                    {selectedArtifactType === "risks" && (
                      <pre className="whitespace-pre-wrap font-sans">
                        # Risk Assessment Matrix
                        {"\n\n"}
                        {generatedPlan.risks?.map((r) => `[${r.severity}] ${r.title}\nMitigation: ${r.mitigation}`).join("\n\n")}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No active artifact generated for this conversation yet. Enter your system prompt in the Planner Chat tab to generate artifacts.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explicit Approval Safety Confirmation Modal */}
      {showApprovalDialog && generatedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[1100] p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Approve & Create Project</h4>
                <p className="text-xs text-slate-400">Confirm project materialization from approved plan</p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between text-slate-300">
                <span>Project Name:</span>
                <span className="font-bold text-white">{generatedPlan.name}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Modules & Epics:</span>
                <span className="font-bold text-white">{generatedPlan.modules?.length || 0} Modules</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Tasks & Subtasks:</span>
                <span className="font-bold text-white">{generatedPlan.tasks?.length || 0} Tasks</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Duration:</span>
                <span className="font-bold text-white">~{generatedPlan.timeline?.estimatedCalendarWeeks || 4} Weeks</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Clicking Confirm will create the Project, Custom Workflow States, Epics, Tasks, Subtasks, Dependencies, and canonical PRD Document.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowApprovalDialog(false)}
                className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlanExecution}
                disabled={confirming}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/50 transition disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{confirming ? "Creating Project..." : "Confirm & Create"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiProjectPlanModal;
