import React from "react";
import {
  Activity,
  Play,
  Pause,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from "lucide-react";
import { PromptCanaryDeployment } from "@/services/prompts";

interface CanaryDeploymentBannerProps {
  canary: PromptCanaryDeployment | null;
  onAdvance: () => void;
  onPause: () => void;
  onResume: () => void;
  onRollback: () => void;
  onComplete: () => void;
  isActionLoading?: boolean;
}

export const CanaryDeploymentBanner: React.FC<CanaryDeploymentBannerProps> = ({
  canary,
  onAdvance,
  onPause,
  onResume,
  onRollback,
  onComplete,
  isActionLoading = false,
}) => {
  if (!canary || canary.status === "completed" || canary.status === "cancelled") {
    return null;
  }

  const {
    status,
    currentPhase,
    trafficWeight,
    legacyVersion,
    candidateVersion,
    metrics,
    errorThreshold,
  } = canary;

  const totalRequests = metrics?.canaryRequests || 0;
  const errorCount = metrics?.canaryErrors || 0;
  const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;
  const isErrorHigh = errorRate > (errorThreshold || 0.05) * 100;

  const isPaused = status === "paused";
  const isFailed = status === "failed" || status === "rolled_back";

  return (
    <div
      className={`p-4 rounded-xl border mb-4 transition-all shadow-sm ${
        isFailed
          ? "bg-rose-50 border-rose-200 text-rose-900"
          : isPaused
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 border-indigo-200 text-indigo-950"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Status Information */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0">
              <Flame className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-semibold tracking-tight">
              Canary Deployment Rollout
            </h3>

            {/* Status Pill */}
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider border ${
                status === "active"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse"
                  : isPaused
                  ? "bg-amber-100 text-amber-800 border-amber-300"
                  : "bg-rose-100 text-rose-800 border-rose-300"
              }`}
            >
              {status}
            </span>

            <span className="text-xs font-mono font-medium bg-white/80 px-2 py-0.5 rounded border border-gray-200 text-gray-800">
              Phase {currentPhase}/4 ({trafficWeight?.canary ?? 5}% Traffic to v{candidateVersion})
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium flex-wrap text-gray-700">
            <span>
              Primary Prod: <strong className="font-mono">v{legacyVersion}</strong> ({trafficWeight?.legacy ?? 95}%)
            </span>
            <span>
              Candidate: <strong className="font-mono">v{candidateVersion}</strong> ({trafficWeight?.canary ?? 5}%)
            </span>
            <span>
              Canary Requests: <strong className="font-mono">{totalRequests}</strong>
            </span>
            <span
              className={`flex items-center gap-1 ${
                isErrorHigh ? "text-rose-600 font-bold" : "text-emerald-700 font-semibold"
              }`}
            >
              {isErrorHigh && <AlertTriangle className="w-3.5 h-3.5" />}
              Error Rate: <strong className="font-mono">{errorRate.toFixed(1)}%</strong>
              (Max {(errorThreshold * 100).toFixed(0)}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden border border-gray-200/80">
            <div
              className={`h-full transition-all duration-500 ${
                isFailed
                  ? "bg-rose-500"
                  : isPaused
                  ? "bg-amber-500"
                  : "bg-indigo-600"
              }`}
              style={{ width: `${trafficWeight?.canary ?? 5}%` }}
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {!isFailed && (
            <>
              {isPaused ? (
                <button
                  type="button"
                  onClick={onResume}
                  disabled={isActionLoading}
                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" /> Resume Traffic
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPause}
                  disabled={isActionLoading}
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Pause className="w-3.5 h-3.5 text-gray-600" /> Pause Traffic
                </button>
              )}

              {currentPhase < 4 ? (
                <button
                  type="button"
                  onClick={onAdvance}
                  disabled={isActionLoading || isPaused}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  Advance Phase <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onComplete}
                  disabled={isActionLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Complete & Promote
                </button>
              )}

              <button
                type="button"
                onClick={onRollback}
                disabled={isActionLoading}
                className="px-3 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Rollback
              </button>
            </>
          )}

          {isFailed && (
            <div className="text-xs font-semibold text-rose-700 flex items-center gap-2">
              <span>{canary.rollbackReason || "Canary failed automatically"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
