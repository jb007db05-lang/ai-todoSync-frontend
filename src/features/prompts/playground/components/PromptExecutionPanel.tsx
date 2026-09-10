import React from "react";
import { Play, Copy, Check, Settings, Loader2 } from "lucide-react";
import { PlaygroundRunResult, promptService, IPromptMessage } from "@/services/prompts";
import { PromptParameters } from "../hooks/usePlayground";

interface PromptExecutionPanelProps {
  workspaceId: string;
  promptId: string | null;
  body: string;
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  runtimeValues: Record<string, unknown>;
  parameters: PromptParameters;
  isExecuting: boolean;
  setIsExecuting: (executing: boolean) => void;
  runResult: PlaygroundRunResult | null;
  setRunResult: (result: PlaygroundRunResult | null) => void;
  executionError: string | null;
  setExecutionError: (err: string | null) => void;
  onOpenParametersModal: () => void;
}

export const PromptExecutionPanel: React.FC<PromptExecutionPanelProps> = ({
  workspaceId,
  promptId,
  body,
  messages,
  runtimeValues,
  parameters,
  isExecuting,
  setIsExecuting,
  runResult,
  setRunResult,
  executionError,
  setExecutionError,
  onOpenParametersModal,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleRunPlayground = async () => {
    try {
      setIsExecuting(true);
      setExecutionError(null);
      const result = await promptService.runPlayground(workspaceId, {
        promptId: promptId || undefined,
        body,
        messages: messages as IPromptMessage[],
        variables: runtimeValues,
        parameters: {
          temperature: parameters.temperature,
          maxTokens: parameters.maxTokens,
          topP: parameters.topP,
        },
        provider: parameters.provider,
        modelName: parameters.modelName,
      });
      setRunResult(result);
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setExecutionError(errorObj.response?.data?.message || errorObj.message || "Failed to execute prompt run.");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyOutput = () => {
    if (runResult?.output) {
      navigator.clipboard.writeText(runResult.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          Playground Execution Output
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenParametersModal}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-gray-500" />
            Config ({parameters.modelName})
          </button>

          <button
            type="button"
            onClick={handleRunPlayground}
            disabled={isExecuting}
            className="px-4 py-1.5 rounded-lg bg-olive-700 hover:bg-olive-800 text-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Run Test Prompt
              </>
            )}
          </button>
        </div>
      </div>

      {executionError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {executionError}
        </div>
      )}

      {runResult ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200 text-[11px] text-gray-600 font-mono">
            <div className="flex items-center gap-3">
              <span>Model: <strong>{runResult.metadata?.modelName || parameters.modelName}</strong></span>
              <span>Tokens: <strong>{runResult.metadata?.totalTokens || 0}</strong></span>
              <span>Latency: <strong>{runResult.metadata?.latencyMs || 0}ms</strong></span>
            </div>
            <button
              type="button"
              onClick={handleCopyOutput}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-900 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Output"}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto min-h-[160px] whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
            {runResult.output || "No output returned from playground model execution."}
          </div>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400 space-y-1">
          <p className="font-semibold text-gray-600">No Execution Run Output</p>
          <p>Click &quot;Run Test Prompt&quot; above to execute your prompt template against selected model AI providers.</p>
        </div>
      )}
    </div>
  );
};
