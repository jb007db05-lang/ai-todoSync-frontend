import React, { useState, useEffect } from "react";
import {
  X,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Play,
} from "lucide-react";
import {
  promptService,
  PromptItem,
  PromptVersion,
} from "@/services/prompts";

interface PromptVersionCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  prompt: PromptItem;
}

export const PromptVersionCompareModal: React.FC<PromptVersionCompareModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  prompt,
}) => {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [v1Number, setV1Number] = useState<number>(1);
  const [v2Number, setV2Number] = useState<number>(prompt.version);
  const [compareData, setCompareData] = useState<{
    v1: PromptVersion;
    v2: PromptVersion;
    hashMatch: boolean;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "side-by-side" | "unified-diff" | "variables" | "model-config" | "test-exec"
  >("side-by-side");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [testVars, setTestVars] = useState<Record<string, string>>({});
  const [executedOutput, setExecutedOutput] = useState<string>("");

  useEffect(() => {
    if (isOpen && prompt) {
      loadVersions();
    }
  }, [isOpen, prompt]);

  const loadVersions = async () => {
    try {
      setIsLoading(true);
      const list = await promptService.getPromptVersions(workspaceId, prompt._id);
      setVersions(list);
      if (list.length >= 2) {
        setV1Number(list[list.length - 1].version);
        setV2Number(list[0].version);
        fetchCompare(list[list.length - 1].version, list[0].version);
      } else if (list.length === 1) {
        setV1Number(list[0].version);
        setV2Number(list[0].version);
        fetchCompare(list[0].version, list[0].version);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompare = async (v1: number, v2: number) => {
    try {
      setIsLoading(true);
      const res = await promptService.comparePromptVersions(
        workspaceId,
        prompt._id,
        v1,
        v2,
      );
      setCompareData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectV1 = (v: number) => {
    setV1Number(v);
    fetchCompare(v, v2Number);
  };

  const handleSelectV2 = (v: number) => {
    setV2Number(v);
    fetchCompare(v1Number, v);
  };

  if (!isOpen) return null;

  const renderUnifiedDiff = (str1: string, str2: string) => {
    const lines1 = str1.split("\n");
    const lines2 = str2.split("\n");
    const maxLen = Math.max(lines1.length, lines2.length);
    const diffRows = [];

    for (let i = 0; i < maxLen; i++) {
      const l1 = lines1[i] ?? "";
      const l2 = lines2[i] ?? "";
      if (l1 === l2) {
        diffRows.push(
          <div key={i} className="text-slate-400 px-4 py-0.5 font-mono text-xs">
            {l1}
          </div>,
        );
      } else {
        if (l1) {
          diffRows.push(
            <div key={`del-${i}`} className="bg-rose-500/10 text-rose-300 px-4 py-0.5 font-mono text-xs border-l-2 border-rose-500">
              - {l1}
            </div>,
          );
        }
        if (l2) {
          diffRows.push(
            <div key={`add-${i}`} className="bg-emerald-500/10 text-emerald-300 px-4 py-0.5 font-mono text-xs border-l-2 border-emerald-500">
              + {l2}
            </div>,
          );
        }
      }
    }
    return diffRows;
  };

  const runTestPreview = () => {
    if (!compareData) return;
    let template = compareData.v2.body || "";
    for (const [key, val] of Object.entries(testVars)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g");
      template = template.replace(regex, val || `[${key}]`);
    }
    setExecutedOutput(template);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                5-Tab Version Compare — {prompt.name}
              </h2>
              <p className="text-xs text-slate-400">
                Compare immutable SHA-256 content hashes, variables, and multi-role prompt structures.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Selector Bar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Base Version (v1):</span>
              <select
                value={v1Number}
                onChange={(e) => handleSelectV1(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1 font-mono focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} ({new Date(v.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-600 font-semibold">vs</span>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Candidate Version (v2):</span>
              <select
                value={v2Number}
                onChange={(e) => handleSelectV2(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1 font-mono focus:outline-none"
              >
                {versions.map((v) => (
                  <option key={v.version} value={v.version}>
                    v{v.version} ({new Date(v.createdAt).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {compareData && (
            <div className="flex items-center gap-2 text-xs">
              {compareData.hashMatch ? (
                <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Canonical SHA-256 Match
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" /> Content Hash Modified
                </span>
              )}
            </div>
          )}
        </div>

        {/* 5-Tab Navigation Header */}
        <div className="flex border-b border-slate-800 bg-slate-900/80 px-6 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab("side-by-side")}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "side-by-side"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Side-by-Side
          </button>
          <button
            onClick={() => setActiveTab("unified-diff")}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "unified-diff"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            2. Unified Diff
          </button>
          <button
            onClick={() => setActiveTab("variables")}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "variables"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            3. Variables Schema
          </button>
          <button
            onClick={() => setActiveTab("model-config")}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "model-config"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            4. SHA-256 & Audit
          </button>
          <button
            onClick={() => setActiveTab("test-exec")}
            className={`py-3 px-4 border-b-2 transition ${
              activeTab === "test-exec"
                ? "border-indigo-500 text-indigo-400 font-semibold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            5. Test Preview
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Loading version data...
            </div>
          ) : !compareData ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Select two versions to compare.
            </div>
          ) : (
            <>
              {/* TAB 1: SIDE-BY-SIDE */}
              {activeTab === "side-by-side" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 border-b border-slate-800 pb-2">
                      <span>v{compareData.v1.version} Prompt Body</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {compareData.v1.hash ? compareData.v1.hash.slice(0, 8) : "N/A"}
                      </span>
                    </div>
                    <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {compareData.v1.body}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-400 border-b border-slate-800 pb-2">
                      <span>v{compareData.v2.version} Prompt Body</span>
                      <span className="font-mono text-[10px] text-indigo-500">
                        {compareData.v2.hash ? compareData.v2.hash.slice(0, 8) : "N/A"}
                      </span>
                    </div>
                    <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {compareData.v2.body}
                    </pre>
                  </div>
                </div>
              )}

              {/* TAB 2: UNIFIED DIFF */}
              {activeTab === "unified-diff" && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 pb-2 border-b border-slate-800">
                    Line-by-Line Diff (v{compareData.v1.version} → v{compareData.v2.version})
                  </div>
                  <div className="py-2">
                    {renderUnifiedDiff(compareData.v1.body, compareData.v2.body)}
                  </div>
                </div>
              )}

              {/* TAB 3: VARIABLES SCHEMA */}
              {activeTab === "variables" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-semibold text-slate-400 border-b border-slate-800 pb-2">
                      v{compareData.v1.version} Variables ({compareData.v1.variables?.length || 0})
                    </h4>
                    {(compareData.v1.variables || []).map((v) => (
                      <div key={v.name} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                        <span className="text-indigo-400 font-semibold">{`{{${v.name}}}`}</span> ({v.type || "string"})
                        <p className="text-[11px] text-slate-400 mt-1 font-sans">{v.description || "No description"}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-semibold text-indigo-400 border-b border-slate-800 pb-2">
                      v{compareData.v2.version} Variables ({compareData.v2.variables?.length || 0})
                    </h4>
                    {(compareData.v2.variables || []).map((v) => (
                      <div key={v.name} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono">
                        <span className="text-indigo-400 font-semibold">{`{{${v.name}}}`}</span> ({v.type || "string"})
                        <p className="text-[11px] text-slate-400 mt-1 font-sans">{v.description || "No description"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: MODEL CONFIG & SHA-256 AUDIT */}
              {activeTab === "model-config" && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Canonical Version Hashes & Immutability Ledger
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-slate-400 font-medium">v{compareData.v1.version} SHA-256 Hash</div>
                        <div className="font-mono text-emerald-400 break-all text-[11px] mt-1">
                          {compareData.v1.hash || "Legacy unhashed version"}
                        </div>
                        <div className="text-slate-500 mt-2">
                          Changed by: {compareData.v1.changedBy?.name || "System"} on{" "}
                          {new Date(compareData.v1.createdAt).toLocaleString()}
                        </div>
                        <div className="text-slate-400 italic mt-1">{compareData.v1.changeNote || "Initial creation"}</div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div className="text-indigo-400 font-medium">v{compareData.v2.version} SHA-256 Hash</div>
                        <div className="font-mono text-indigo-300 break-all text-[11px] mt-1">
                          {compareData.v2.hash || "Legacy unhashed version"}
                        </div>
                        <div className="text-slate-500 mt-2">
                          Changed by: {compareData.v2.changedBy?.name || "System"} on{" "}
                          {new Date(compareData.v2.createdAt).toLocaleString()}
                        </div>
                        <div className="text-slate-400 italic mt-1">{compareData.v2.changeNote || "Updated version"}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TEST PREVIEW */}
              {activeTab === "test-exec" && (
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <h4 className="font-semibold text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-indigo-400" />
                      Test Execution Preview (v{compareData.v2.version})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-3">
                        <span className="text-slate-400 font-medium">Populate Test Variables:</span>
                        {(compareData.v2.variables || []).map((v) => (
                          <div key={v.name}>
                            <label className="block text-[11px] font-mono text-indigo-300 mb-1">
                              {`{{${v.name}}}`}
                            </label>
                            <input
                              type="text"
                              value={testVars[v.name] || ""}
                              onChange={(e) =>
                                setTestVars({ ...testVars, [v.name]: e.target.value })
                              }
                              placeholder={v.defaultValue || `Enter ${v.name}...`}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={runTestPreview}
                          className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-500 transition flex items-center gap-2 mt-2"
                        >
                          <Play className="w-3.5 h-3.5" /> Render Template Preview
                        </button>
                      </div>

                      <div className="space-y-2">
                        <span className="text-slate-400 font-medium">Rendered Output:</span>
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-slate-200 min-h-[160px] whitespace-pre-wrap">
                          {executedOutput || "Click 'Render Template Preview' to inspect resolved prompt..."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-300 bg-slate-800 hover:bg-slate-700 text-sm font-medium transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
