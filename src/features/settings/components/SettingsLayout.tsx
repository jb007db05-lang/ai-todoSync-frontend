import React from "react";
import { UserCircle, Settings2, TimerReset, Sparkles, Smartphone } from "lucide-react";
import { ProfileSettings } from "./ProfileSettings";
import { ChatGPTIntegrationSettings } from "./ChatGPTIntegrationSettings";
import { WorkspaceSettingsPanel } from "@/features/workspaces";
import ManageDevicesModal from "@/components/ManageDevicesModal";
import SectionCard from "@/components/SectionCard";
import type { TaskPriority } from "@/types/task";
import type { AuthProfile } from "@/store/authSlice";
import type { CompanionDevice } from "../hooks/useSettings";
import type { Project } from "@/types/project";

interface SettingsLayoutProps {
  user: AuthProfile | null;
  activeTab: "profile" | "workspace" | "sla" | "chatgpt" | "companion";
  setActiveTab: (tab: "profile" | "workspace" | "sla" | "chatgpt" | "companion") => void;
  showKey: boolean;
  setShowKey: (show: boolean) => void;
  apiKeyCopied: boolean;
  schemaCopied: boolean;
  instructionsCopied: boolean;
  isRegeneratingKey: boolean;
  companionDevices: CompanionDevice[];
  isCompanionModalOpen: boolean;
  setIsCompanionModalOpen: (open: boolean) => void;
  isGeneratingCompanionKey: boolean;
  isLoadingCompanionDevices: boolean;
  slaConfigs: Record<TaskPriority, number>;
  isLoadingSla: boolean;
  isSavingSla: boolean;
  onCopyApiKey: (text: string) => void;
  onCopySchema: () => void;
  onCopyInstructions: () => void;
  onRegenerateKey: () => void;
  onGenerateCompanionKey: () => void;
  onRevokeCompanionDevice: (id: string) => void;
  onSaveSlaConfig: (priority: TaskPriority, hours: number) => void;
  projects: Project[];
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  user,
  activeTab,
  setActiveTab,
  showKey,
  setShowKey,
  apiKeyCopied,
  schemaCopied,
  instructionsCopied,
  isRegeneratingKey,
  companionDevices,
  isCompanionModalOpen,
  setIsCompanionModalOpen,
  isGeneratingCompanionKey,
  isLoadingCompanionDevices,
  slaConfigs,
  isLoadingSla,
  isSavingSla,
  onCopyApiKey,
  onCopySchema,
  onCopyInstructions,
  onRegenerateKey,
  onGenerateCompanionKey,
  onRevokeCompanionDevice,
  onSaveSlaConfig,
}) => {
  return (
    <div className="space-y-6 font-sans">
      {/* Settings Navigation Header */}
      <div className="bg-white rounded border border-olive-200 p-5 shadow-xs">
        <h2 className="text-base font-bold text-olive-950">System & Account Settings</h2>
        <p className="text-xs text-olive-600 mt-1">
          Configure personal credentials, team SLA response windows, ChatGPT Actions, and companion devices.
        </p>

        <div className="flex flex-wrap items-center gap-1.5 mt-5 border-b border-olive-200 pb-3 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-3 py-1.5 rounded transition flex items-center gap-2 cursor-pointer ${
              activeTab === "profile"
                ? "bg-olive-800 text-white font-semibold shadow-xs"
                : "text-olive-700 hover:bg-olive-100/70 hover:text-olive-950"
            }`}
          >
            <UserCircle className="w-3.5 h-3.5" /> Profile & API Key
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workspace")}
            className={`px-3 py-1.5 rounded transition flex items-center gap-2 cursor-pointer ${
              activeTab === "workspace"
                ? "bg-olive-800 text-white font-semibold shadow-xs"
                : "text-olive-700 hover:bg-olive-100/70 hover:text-olive-950"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" /> Workspace
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sla")}
            className={`px-3 py-1.5 rounded transition flex items-center gap-2 cursor-pointer ${
              activeTab === "sla"
                ? "bg-olive-800 text-white font-semibold shadow-xs"
                : "text-olive-700 hover:bg-olive-100/70 hover:text-olive-950"
            }`}
          >
            <TimerReset className="w-3.5 h-3.5" /> SLA Targets
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("chatgpt")}
            className={`px-3 py-1.5 rounded transition flex items-center gap-2 cursor-pointer ${
              activeTab === "chatgpt"
                ? "bg-olive-800 text-white font-semibold shadow-xs"
                : "text-olive-700 hover:bg-olive-100/70 hover:text-olive-950"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> ChatGPT Integration
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("companion")}
            className={`px-3 py-1.5 rounded transition flex items-center gap-2 cursor-pointer ${
              activeTab === "companion"
                ? "bg-olive-800 text-white font-semibold shadow-xs"
                : "text-olive-700 hover:bg-olive-100/70 hover:text-olive-950"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Companion Devices
          </button>
        </div>
      </div>

      {activeTab === "profile" && (
        <ProfileSettings
          user={user}
          showKey={showKey}
          setShowKey={setShowKey}
          apiKeyCopied={apiKeyCopied}
          isRegeneratingKey={isRegeneratingKey}
          onCopyApiKey={onCopyApiKey}
          onRegenerateKey={onRegenerateKey}
        />
      )}

      {activeTab === "workspace" && (
        <WorkspaceSettingsPanel />
      )}

      {activeTab === "sla" && (
        <SectionCard>
          <h3 className="text-sm font-bold text-olive-950 mb-1">SLA Target Response Times</h3>
          <p className="text-xs text-olive-600 mb-4">Set target resolution windows in hours for task priorities across your team.</p>
          {isLoadingSla ? (
            <div className="p-8 text-center text-olive-500 text-xs">Loading SLA configurations...</div>
          ) : (
            <div className="space-y-3 text-xs">
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as TaskPriority[]).map((priority) => (
                <div key={priority} className="flex items-center justify-between p-3 rounded border border-olive-200 bg-olive-50/40">
                  <div>
                    <span className="font-bold text-olive-950">{priority} Priority</span>
                    <p className="text-[11px] text-olive-600">Target response window in hours</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="720"
                      value={slaConfigs[priority] || 24}
                      onChange={(e) => onSaveSlaConfig(priority, parseInt(e.target.value) || 24)}
                      disabled={isSavingSla}
                      className="w-20 bg-white border border-olive-300 focus:border-olive-600 rounded px-2.5 py-1 text-xs font-mono font-bold text-olive-950 outline-none"
                    />
                    <span className="text-olive-600 text-xs font-medium">hours</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {activeTab === "chatgpt" && (
        <ChatGPTIntegrationSettings
          schemaCopied={schemaCopied}
          instructionsCopied={instructionsCopied}
          onCopySchema={onCopySchema}
          onCopyInstructions={onCopyInstructions}
          onNavigateToProfile={() => setActiveTab("profile")}
        />
      )}

      {activeTab === "companion" && (
        <SectionCard>
          <h3 className="text-sm font-bold text-olive-950 mb-1">Companion Mobile & Desktop Devices</h3>
          <p className="text-xs text-olive-600 mb-4">Pair and manage companion mobile apps or desktop notification clients.</p>
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-olive-700">Active Companion Devices: <strong className="text-olive-950">{companionDevices.length}</strong></span>
              <button
                type="button"
                onClick={onGenerateCompanionKey}
                disabled={isGeneratingCompanionKey}
                className="px-3.5 py-1.5 rounded bg-olive-800 hover:bg-olive-900 text-white text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isGeneratingCompanionKey ? "Generating..." : "Generate Companion Key"}
              </button>
            </div>

            {isLoadingCompanionDevices ? (
              <div className="p-6 text-center text-olive-500 text-xs">Loading companion devices...</div>
            ) : companionDevices.length === 0 ? (
              <div className="p-6 text-center text-olive-500 text-xs rounded border border-dashed border-olive-300 bg-olive-50/30">
                No companion devices currently paired.
              </div>
            ) : (
              <div className="space-y-2">
                {companionDevices.map((dev) => (
                  <div key={dev.id} className="flex items-center justify-between p-3 rounded border border-olive-200 bg-white">
                    <div className="space-y-0.5">
                      <h5 className="font-bold text-olive-950">{dev.deviceName}</h5>
                      <span className="text-[10px] text-olive-600 uppercase font-mono">{dev.deviceType} • {dev.status}</span>
                    </div>
                    {dev.status === "active" && (
                      <button
                        type="button"
                        onClick={() => onRevokeCompanionDevice(dev.id)}
                        className="px-3 py-1 rounded border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium text-xs transition cursor-pointer"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {isCompanionModalOpen && (
        <ManageDevicesModal
          onClose={() => setIsCompanionModalOpen(false)}
        />
      )}
    </div>
  );
};
