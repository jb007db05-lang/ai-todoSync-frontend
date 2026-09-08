import React, { useState, useEffect } from "react";
import {
  centralizedAiService,
  AIProjectPlanResponse,
  AIPlanModificationResponse,
} from "../services/centralizedAi";
import {
  Sparkles,
  Check,
  Layers,
  Users,
  ShieldAlert,
  Clock,
  ArrowRight,
  X,
  FileText,
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
  onProjectCreated: (project: any) => void;
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
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "ai"; content: string; plan?: AIProjectPlanResponse; delta?: any }>
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
  const [savedWorkspacePlans, setSavedWorkspacePlans] = useState<any[]>([]);
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
        const formattedSessions = historySessions.map((s: any) => ({
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
          detail.messages.map((m: any) => ({
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
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to generate project plan");
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
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to update project plan");
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
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to materialize project");
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
    <div className="fixed inset-0 bg-olive-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4 overflow-y-auto">
      <div className="bg-white border border-olive-200 rounded-xl w-full max-w-5xl h-[90vh] flex shadow-xl overflow-hidden animate-modalIn">
        {/* Left History Sidebar */}
        <div className="w-64 border-r border-olive-200 bg-olive-50/70 p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-olive-800 uppercase tracking-wider flex items-center space-x-1.5">
                <History className="w-3.5 h-3.5 text-olive-700" />
                <span>Conversation History</span>
              </span>
            </div>

            {/* New Chat Button */}
            <button
              onClick={startNewSession}
              className="w-full py-2 px-3 bg-olive-700 hover:bg-olive-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 shadow-sm transition"
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
                  className={`w-full group flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                    sess.id === activeSessionId
                      ? "bg-olive-100 border-olive-400 text-olive-950 font-semibold shadow-sm"
                      : "bg-white border-olive-200 text-olive-800 hover:bg-olive-100/60"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="truncate font-medium text-olive-950">{sess.title}</div>
                    <div className="text-[10px] text-olive-500 mt-0.5">{sess.createdAt}</div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, sess.id)}
                    title="Delete Session"
                    className="p-1 rounded text-olive-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-olive-200 text-[11px] text-olive-600 flex items-center justify-between font-medium">
            <span>Workspace AI Planner</span>
            <span className="w-2 h-2 rounded-full bg-olive-600"></span>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Header & Main Tabs */}
          <div className="px-6 py-4 bg-olive-50 border-b border-olive-200 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-olive-700 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-olive-950">AI Project Architect & Master Planner</h3>
                <p className="text-xs text-olive-600">Transform high-level system ideas into reviewable blueprints & PRDs</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Model Selector Dropdown */}
              <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-olive-200 shadow-sm space-x-2 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-olive-700 shrink-0" />
                <span className="font-semibold text-olive-700 hidden sm:inline">Model:</span>
                <select
                  value={`${selectedProvider}:${selectedModel}`}
                  onChange={(e) => {
                    const [p, m] = e.target.value.split(":");
                    setSelectedProvider(p as any);
                    setSelectedModel(m);
                  }}
                  className="bg-transparent text-olive-950 font-bold text-xs focus:outline-none cursor-pointer pr-1"
                >
                  <option value="gemini:gemini-3.6-flash">✨ Google Gemini 3.6 Flash (Default)</option>
                  <option value="gemini:gemini-2.5-pro">🧠 Google Gemini 2.5 Pro</option>
                  <option value="openai:gpt-4o">🚀 OpenAI GPT-4o</option>
                  <option value="openai:gpt-4o-mini">⚡ OpenAI GPT-4o Mini</option>
                  <option value="anthropic:claude-3-5-sonnet">🎭 Anthropic Claude 3.5 Sonnet</option>
                </select>
              </div>

              {/* Main Tabs: Chat vs Artifacts */}
              <div className="flex items-center bg-white p-1 rounded-lg border border-olive-200 space-x-1">
                <button
                  onClick={() => setActiveMainTab("chat")}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeMainTab === "chat"
                      ? "bg-olive-700 text-white shadow-sm"
                      : "text-olive-700 hover:bg-olive-50"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Planner Chat</span>
                </button>
                <button
                  onClick={() => setActiveMainTab("artifacts")}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition ${
                    activeMainTab === "artifacts"
                      ? "bg-olive-700 text-white shadow-sm"
                      : "text-olive-700 hover:bg-olive-50"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Artifacts & PRDs ({generatedPlan ? 1 + savedWorkspacePlans.length : savedWorkspacePlans.length})</span>
                </button>
              </div>

              <button onClick={onClose} className="h-8 px-3 text-[0.8rem] bg-white border border-olive-200 rounded text-olive-700 hover:bg-olive-50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Body */}
          {activeMainTab === "chat" ? (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {error && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center space-x-2 font-bold text-red-900">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                  {(error.includes("429") || error.includes("quota") || error.includes("RESOURCE_EXHAUSTED")) && (
                    <div className="pt-1.5 text-[11px] text-red-700 border-t border-red-200 flex items-center justify-between">
                      <span>💡 Quota limit reached on {selectedModel}. Switch to another AI Model using the dropdown in the top header above!</span>
                    </div>
                  )}
                </div>
              )}

              {!generatedPlan ? (
                /* System Prompt Input */
                <form onSubmit={handleGenerate} className="space-y-4 max-w-2xl mx-auto pt-6">
                  <div className="text-center space-y-1 mb-6">
                    <h4 className="text-lg font-bold text-olive-950">Describe Your System or Product Idea</h4>
                    <p className="text-xs text-olive-600">Describe the basic workflow in simple language. The AI will decompose actors, system modules, feature specs, effort, and risks without writing source code.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-olive-800 uppercase tracking-wider mb-2">
                      High-Level System Requirement
                    </label>
                    <textarea
                      rows={5}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. I want to build a SaaS CRM where sales reps manage leads and opportunities, managers monitor team pipelines and metrics, and admins configure user permissions."
                      className="w-full bg-white border border-olive-200 rounded-lg p-4 text-sm text-olive-950 focus:outline-none focus:border-olive-600 leading-relaxed font-sans"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-olive-800 uppercase tracking-wider mb-2">
                      Technical Stack / Constraints (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="e.g. Stack: Node, React, Mongoose. Target: Launch MVP in 6 weeks."
                      className="w-full bg-white border border-olive-200 rounded-lg p-3 text-sm text-olive-950 focus:outline-none focus:border-olive-600"
                    />
                  </div>

                  {loading && (
                    <div className="p-4 bg-olive-50 border border-olive-300 rounded-xl space-y-3">
                      <div className="flex items-center space-x-3 text-olive-950 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-olive-700 animate-spin shrink-0" />
                        <span>AI Architect is synthesizing your technical blueprint...</span>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-olive-800">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-olive-600 animate-ping shrink-0" />
                          <span>Decomposing user workflows, actors, permissions, and core modules</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-olive-500 shrink-0" />
                          <span>Generating frontend, backend, database schema & API specifications</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-olive-400 shrink-0" />
                          <span>Estimating engineering effort, risk mitigations & milestone roadmap</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-olive-600 italic">
                        Detailed production engineering blueprints take ~30–60 seconds to synthesize.
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 bg-olive-700 hover:bg-olive-800 text-white font-bold rounded-lg text-xs shadow-sm transition disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{loading ? "Architecting System Blueprint..." : "Generate Technical Blueprint"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Generated Blueprint Review & Revision Stream */
                <div className="space-y-6">
                  {/* Delta Banner if modified */}
                  {lastDelta && (
                    <div className="bg-olive-100/70 border border-olive-300 p-4 rounded-lg space-y-2 text-xs">
                      <div className="flex items-center justify-between text-olive-900 font-bold">
                        <span>✨ Applied Plan Delta Revisions</span>
                        <span>Timeline Adjustment: {lastDelta.timelineDeltaHours > 0 ? `+${lastDelta.timelineDeltaHours}` : lastDelta.timelineDeltaHours}h</span>
                      </div>
                      <p className="text-olive-800">{lastDelta.summary}</p>
                    </div>
                  )}

                  {/* Project Goal Header */}
                  <div className="bg-olive-50 p-5 rounded-lg border border-olive-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-bold text-olive-950">{generatedPlan.name}</h4>
                      <span className="px-3 py-1 bg-olive-200 text-olive-900 border border-olive-300 rounded-full text-xs font-semibold">
                        Technical Blueprint Review
                      </span>
                    </div>
                    <p className="text-xs text-olive-700 mb-3">{generatedPlan.systemGoal || generatedPlan.description}</p>
                  </div>

                  {/* Blueprint Sub-Tabs */}
                  <div className="flex border-b border-olive-200 space-x-6 text-xs font-semibold text-olive-600">
                    <button
                      onClick={() => setActiveBlueprintSubTab("blueprint")}
                      className={`pb-2 transition ${activeBlueprintSubTab === "blueprint" ? "text-olive-900 border-b-2 border-olive-700 font-bold" : "hover:text-olive-950"}`}
                    >
                      Actors & Modules ({generatedPlan.modules?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveBlueprintSubTab("features")}
                      className={`pb-2 transition ${activeBlueprintSubTab === "features" ? "text-olive-900 border-b-2 border-olive-700 font-bold" : "hover:text-olive-950"}`}
                    >
                      Feature Specs ({generatedPlan.tasks?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveBlueprintSubTab("risks")}
                      className={`pb-2 transition ${activeBlueprintSubTab === "risks" ? "text-olive-900 border-b-2 border-olive-700 font-bold" : "hover:text-olive-950"}`}
                    >
                      Risks ({generatedPlan.risks?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveBlueprintSubTab("timeline")}
                      className={`pb-2 transition ${activeBlueprintSubTab === "timeline" ? "text-olive-900 border-b-2 border-olive-700 font-bold" : "hover:text-olive-950"}`}
                    >
                      Timeline ({generatedPlan.timeline?.totalEngineeringHours || 0}h)
                    </button>
                  </div>

                  {/* Blueprint Sub-Tab Content */}
                  {activeBlueprintSubTab === "blueprint" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {generatedPlan.actors?.map((actor, i) => (
                          <div key={i} className="bg-olive-50/50 border border-olive-200 p-3 rounded-lg text-xs space-y-1">
                            <div className="flex items-center justify-between font-bold text-olive-950">
                              <span>{actor.name}</span>
                              <span className="px-2 py-0.5 bg-olive-100 text-olive-800 rounded text-[10px]">{actor.type}</span>
                            </div>
                            <div className="text-olive-700 text-[11px]">{actor.responsibilities?.join(" • ")}</div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        {generatedPlan.modules?.map((mod, i) => (
                          <div key={i} className="bg-olive-50/50 border border-olive-200 p-3.5 rounded-lg text-xs">
                            <div className="font-bold text-olive-950 text-sm mb-0.5">{mod.name}</div>
                            <p className="text-olive-700 text-[11px]">{mod.purpose}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeBlueprintSubTab === "features" && (
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {generatedPlan.tasks?.map((t, i) => (
                        <div key={i} className="bg-white border border-olive-200 p-3.5 rounded-lg text-xs space-y-1">
                          <div className="flex items-center justify-between font-bold text-olive-950">
                            <span>{t.title}</span>
                            <span className="text-olive-600 text-[11px]">{t.estimatedHours}h</span>
                          </div>
                          <p className="text-olive-700 text-[11px]">{t.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeBlueprintSubTab === "risks" && (
                    <div className="space-y-2">
                      {generatedPlan.risks?.map((r, i) => (
                        <div key={i} className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
                          <div className="font-bold">{r.title} ({r.severity})</div>
                          <div className="text-amber-800 text-[11px] mt-0.5">Mitigation: {r.mitigation}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeBlueprintSubTab === "timeline" && generatedPlan.timeline && (
                    <div className="bg-olive-50 p-4 rounded-lg border border-olive-200 text-xs space-y-2">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2.5 bg-white border border-olive-200 rounded-lg">
                          <span className="text-olive-600 block text-[10px]">Total Hours</span>
                          <span className="font-bold text-olive-950 text-base">{generatedPlan.timeline.totalEngineeringHours}h</span>
                        </div>
                        <div className="p-2.5 bg-white border border-olive-200 rounded-lg">
                          <span className="text-olive-600 block text-[10px]">Dev Days</span>
                          <span className="font-bold text-olive-950 text-base">{generatedPlan.timeline.totalEngineeringDays}d</span>
                        </div>
                        <div className="p-2.5 bg-white border border-olive-200 rounded-lg">
                          <span className="text-olive-600 block text-[10px]">Calendar Duration</span>
                          <span className="font-bold text-olive-950 text-base">~{generatedPlan.timeline.estimatedCalendarWeeks}w</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revision Form */}
                  <form onSubmit={handleApplyChangeRequest} className="pt-3 border-t border-olive-200 space-y-2">
                    <label className="block text-xs font-semibold text-olive-800 uppercase tracking-wider">
                      Request Plan Revisions / Scope Changes
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={changeRequest}
                        onChange={(e) => setChangeRequest(e.target.value)}
                        placeholder="e.g. Remove delivery module, or Add Google SSO support"
                        className="flex-1 bg-white border border-olive-200 rounded-lg px-4 py-2.5 text-xs text-olive-950 focus:outline-none focus:border-olive-600"
                      />
                      <button
                        type="submit"
                        disabled={modifying || !changeRequest.trim()}
                        className="px-4 py-2.5 bg-olive-100 hover:bg-olive-200 text-olive-900 border border-olive-300 font-semibold rounded-lg text-xs transition disabled:opacity-50 flex items-center space-x-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{modifying ? "Updating..." : "Update Plan"}</span>
                      </button>
                    </div>
                  </form>

                  {/* Confirm & Materialize Trigger */}
                  <div className="flex items-center justify-between pt-4 border-t border-olive-200">
                    <button
                      type="button"
                      onClick={() => setGeneratedPlan(null)}
                      className="text-xs text-olive-600 hover:text-olive-950"
                    >
                      ← Start Over
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowApprovalDialog(true)}
                      className="inline-flex items-center space-x-2 px-6 py-2.5 bg-olive-700 hover:bg-olive-800 text-white font-bold rounded-lg text-xs shadow-sm transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Create Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* TAB 2: Dedicated Saved Artifacts Tab */
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-olive-200 pb-3">
                <h4 className="font-bold text-olive-950 text-sm">Generated Planning Artifacts & PRD Specifications</h4>
                <div className="flex space-x-2">
                  {(["project_plan", "prd", "tech_spec", "timeline", "risks"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedArtifactType(type)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                        selectedArtifactType === type
                          ? "bg-olive-700 text-white font-semibold"
                          : "bg-white text-olive-700 border border-olive-200 hover:bg-olive-50"
                      }`}
                    >
                      {type.replace("_", " ").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {generatedPlan ? (
                <div className="bg-olive-50/60 border border-olive-200 p-5 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-olive-950 text-sm">{generatedPlan.name}</h5>
                      <span className="text-xs text-olive-600">Canonical {selectedArtifactType.replace("_", " ").toUpperCase()} Specification</span>
                    </div>
                    <button
                      onClick={() => copyArtifactToClipboard(JSON.stringify(generatedPlan, null, 2))}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white border border-olive-200 hover:bg-olive-50 text-olive-800 rounded-lg text-xs transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedText ? "Copied!" : "Copy Specification"}</span>
                    </button>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-olive-200 text-xs font-mono leading-relaxed text-olive-900 max-h-96 overflow-y-auto">
                    {selectedArtifactType === "project_plan" && (
                      <pre className="whitespace-pre-wrap font-sans space-y-2">
                        <strong>Goal:</strong> {generatedPlan.systemGoal}
                        {"\n\n"}
                        <strong>Modules ({generatedPlan.modules?.length}):</strong>
                        {generatedPlan.modules?.map((m) => `\n• ${m.name}: ${m.purpose}`).join("")}
                      </pre>
                    )}
                    {selectedArtifactType === "prd" && (
                      <pre className="whitespace-pre-wrap font-sans">
                        # Product Requirements Document: {generatedPlan.name}
                        {"\n\n"}
                        ## System Purpose
                        {generatedPlan.systemGoal}
                        {"\n\n"}
                        ## Target User Roles
                        {generatedPlan.actors?.map((a) => `- ${a.name} (${a.type}): ${a.responsibilities?.join(", ")}`).join("\n")}
                      </pre>
                    )}
                    {selectedArtifactType === "tech_spec" && (
                      <pre className="whitespace-pre-wrap font-sans">
                        # Technical Specification Scope
                        {"\n\n"}
                        {generatedPlan.tasks?.map((t, idx) => `${idx + 1}. ${t.title} (${t.estimatedHours}h)\n   Criteria: ${t.acceptanceCriteria?.join(" | ") || "N/A"}`).join("\n\n")}
                      </pre>
                    )}
                    {selectedArtifactType === "timeline" && (
                      <pre className="whitespace-pre-wrap font-sans">
                        # Timeline & Development Effort
                        {"\n\n"}
                        • Total Engineering Hours: {generatedPlan.timeline?.totalEngineeringHours}h
                        • Estimated Calendar Duration: ~{generatedPlan.timeline?.estimatedCalendarWeeks} Weeks
                        • Confidence Level: {generatedPlan.timeline?.confidence}
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
                <div className="text-center py-12 text-olive-500 text-xs">
                  No active artifact generated for this conversation yet. Enter your system prompt in the Planner Chat tab to generate artifacts.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Explicit Approval Safety Confirmation Modal */}
      {showApprovalDialog && generatedPlan && (
        <div className="fixed inset-0 bg-olive-900/50 backdrop-blur-sm flex items-center justify-center z-[1100] p-4">
          <div className="bg-white border border-olive-200 rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-olive-100 border border-olive-200 flex items-center justify-center text-olive-800 shrink-0">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-olive-950 text-base">Approve & Create Project</h4>
                <p className="text-xs text-olive-600">Confirm project materialization from approved plan</p>
              </div>
            </div>

            <div className="bg-olive-50/70 p-4 rounded-lg border border-olive-200 text-xs space-y-2">
              <div className="flex justify-between text-olive-800">
                <span>Project Name:</span>
                <span className="font-bold text-olive-950">{generatedPlan.name}</span>
              </div>
              <div className="flex justify-between text-olive-800">
                <span>Modules & Epics:</span>
                <span className="font-bold text-olive-950">{generatedPlan.modules?.length || 0} Modules</span>
              </div>
              <div className="flex justify-between text-olive-800">
                <span>Tasks & Subtasks:</span>
                <span className="font-bold text-olive-950">{generatedPlan.tasks?.length || 0} Tasks</span>
              </div>
              <div className="flex justify-between text-olive-800">
                <span>Estimated Duration:</span>
                <span className="font-bold text-olive-950">~{generatedPlan.timeline?.estimatedCalendarWeeks || 4} Weeks</span>
              </div>
            </div>

            <p className="text-[11px] text-olive-600">
              Clicking Confirm will create the Project, Custom Workflow States, Epics, Tasks, Subtasks, Dependencies, and canonical PRD Document.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowApprovalDialog(false)}
                className="px-4 py-2 bg-white border border-olive-200 text-olive-700 hover:bg-olive-50 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPlanExecution}
                disabled={confirming}
                className="px-5 py-2 bg-olive-700 hover:bg-olive-800 text-white rounded-lg text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center space-x-1.5"
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
