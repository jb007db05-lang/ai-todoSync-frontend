import React from "react";
import { UserCircle, Settings2, TimerReset, Sparkles, Smartphone } from "lucide-react";
import { ProfileSettings } from "./ProfileSettings";
import { ChatGPTIntegrationSettings } from "./ChatGPTIntegrationSettings";
import { CompanionDevicesList } from "./CompanionDevicesList";
import { CompanionDeviceModal } from "./CompanionDeviceModal";
import { WorkspaceSettingsPanel } from "@/features/workspaces";
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
  setSelectedDeviceForRegen: (device: CompanionDevice | null) => void;
  isLoadingCompanionDevices: boolean;
  slaConfigs: Record<TaskPriority, number>;
  isLoadingSla: boolean;
  isSavingSla: boolean;
  onCopyApiKey: (text: string) => void;
  onCopySchema: () => void;
  onCopyInstructions: () => void;
  onRegenerateKey: () => void;
  createCompanionDeviceAndKey: (name: string, type: string) => Promise<{ pairingKey: string; device: CompanionDevice }>;
  onRevokeCompanionDevice: (id: string) => void;
  onSaveSlaConfig: (priority: TaskPriority, hours: number) => void;
  fetchCompanionDevices: () => Promise<void>;
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
  setSelectedDeviceForRegen,
  isLoadingCompanionDevices,
  slaConfigs,
  isLoadingSla,
  isSavingSla,
  onCopyApiKey,
  onCopySchema,
  onCopyInstructions,
  onRegenerateKey,
  createCompanionDeviceAndKey,
  onRevokeCompanionDevice,
  onSaveSlaConfig,
  fetchCompanionDevices,
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
        <CompanionDevicesList
          devices={companionDevices}
          isLoading={isLoadingCompanionDevices}
          onOpenCreateModal={() => {
            setSelectedDeviceForRegen(null);
            setIsCompanionModalOpen(true);
          }}
          onOpenPairModal={() => {
            setSelectedDeviceForRegen(null);
            setIsCompanionModalOpen(true);
          }}
          onRegenerateKey={(device) => {
            setSelectedDeviceForRegen(device);
            setIsCompanionModalOpen(true);
          }}
          onRevokeDevice={onRevokeCompanionDevice}
        />
      )}

      {isCompanionModalOpen && (
        <CompanionDeviceModal
          isOpen={isCompanionModalOpen}
          onClose={() => {
            setIsCompanionModalOpen(false);
            setSelectedDeviceForRegen(null);
          }}
          onCreateDevice={createCompanionDeviceAndKey}
          onRefreshDevices={fetchCompanionDevices}
        />
      )}
    </div>
  );
};
