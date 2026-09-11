import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useConfirm } from "@/context/ConfirmationContext";
import { useToast } from "@/context/ToastContext";
import api from "@/services/api";
import { getSlaConfigs, updateSlaConfig } from "@/services/sla";
import type { SlaConfig, TaskPriority } from "@/types/task";
import { SYNC_CHATGPT_ACTION_SCHEMA, SYNC_CHATGPT_INSTRUCTION_TEXT } from "@/features/sync/schema";

export interface CompanionDevice {
  id: string;
  deviceName: string;
  deviceType: string;
  status: "pending" | "active" | "revoked";
  createdAt?: string;
  updatedAt?: string;
  revokedAt?: string | null;
}

export function useSettings() {
  const { user, refreshUser } = useAuth();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<"profile" | "workspace" | "sla" | "chatgpt" | "companion" | "mcp">("profile");
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [schemaCopied, setSchemaCopied] = useState(false);
  const [instructionsCopied, setInstructionsCopied] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [companionDevices, setCompanionDevices] = useState<CompanionDevice[]>([]);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [selectedDeviceForRegen, setSelectedDeviceForRegen] = useState<CompanionDevice | null>(null);
  const [isLoadingCompanionDevices, setIsLoadingCompanionDevices] = useState(false);

  const [slaConfigs, setSlaConfigs] = useState<Record<TaskPriority, number>>({
    LOW: 72,
    MEDIUM: 48,
    HIGH: 24,
    CRITICAL: 4,
  });
  const [isLoadingSla, setIsLoadingSla] = useState(false);
  const [isSavingSla, setIsSavingSla] = useState(false);

  const fetchCompanionDevices = useCallback(async () => {
    try {
      setIsLoadingCompanionDevices(true);
      const res = await api.get<{ message: string; data: { devices: CompanionDevice[] } }>("/companion/devices");
      setCompanionDevices(res.data.data?.devices || []);
    } catch (err) {
      console.error("Failed to load companion devices", err);
    } finally {
      setIsLoadingCompanionDevices(false);
    }
  }, []);

  const fetchSlaConfigs = useCallback(async () => {
    try {
      setIsLoadingSla(true);
      const data = await getSlaConfigs();
      const configMap: Record<TaskPriority, number> = {
        LOW: 72,
        MEDIUM: 48,
        HIGH: 24,
        CRITICAL: 4,
      };
      data.forEach((c: SlaConfig) => {
        configMap[c.priority] = c.responseTimeHours;
      });
      setSlaConfigs(configMap);
    } catch (err) {
      console.error("Failed to load SLA configs", err);
    } finally {
      setIsLoadingSla(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "companion" || activeTab === "mcp") fetchCompanionDevices();
    if (activeTab === "sla") fetchSlaConfigs();
  }, [activeTab, fetchCompanionDevices, fetchSlaConfigs]);

  const handleCopyApiKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setApiKeyCopied(true);
    showToast({ variant: "success", message: "API Key copied to clipboard" });
    setTimeout(() => setApiKeyCopied(false), 2000);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SYNC_CHATGPT_ACTION_SCHEMA);
    setSchemaCopied(true);
    showToast({ variant: "success", message: "Action schema copied to clipboard" });
    setTimeout(() => setSchemaCopied(false), 2000);
  };

  const handleCopyInstructions = () => {
    navigator.clipboard.writeText(SYNC_CHATGPT_INSTRUCTION_TEXT);
    setInstructionsCopied(true);
    showToast({ variant: "success", message: "Instructions copied to clipboard" });
    setTimeout(() => setInstructionsCopied(false), 2000);
  };

  const handleRegenerateKey = async () => {
    const isConfirmed = await confirm({
      title: "Regenerate Sync API Key?",
      message: "Regenerating this key will immediately revoke your existing ChatGPT Action key. Any active ChatGPT custom GPTs using the old key will stop working until updated.",
      confirmText: "Regenerate Key",
      type: "danger",
    });

    if (!isConfirmed) return;

    try {
      setIsRegeneratingKey(true);
      await api.post<{ message: string; data: { syncApiKey: string } }>("/users/me/sync-key/regenerate");
      await refreshUser();
      showToast({ variant: "success", message: "Sync API Key regenerated successfully" });
    } catch (err) {
      console.error("Failed to regenerate key", err);
      showToast({ variant: "error", message: "Failed to regenerate key" });
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const createCompanionDeviceAndKey = async (deviceName: string, deviceType: string) => {
    const res = await api.post<{ message: string; device: CompanionDevice; pairingKey: string }>(
      "/companion/devices",
      { deviceName, deviceType }
    );
    showToast({ variant: "success", message: "Companion key generated. Save it before closing!" });
    fetchCompanionDevices();
    return { device: res.data.device, pairingKey: res.data.pairingKey };
  };

  const pairCompanionDeviceWithKey = async (pairingKey: string) => {
    await api.post("/companion/pair/key", { pairingKey });
    showToast({ variant: "success", message: "Companion device paired successfully" });
    fetchCompanionDevices();
  };

  const pairCompanionDeviceWithQr = async (qrToken: string) => {
    await api.post("/companion/pair/qr", { qrToken });
    showToast({ variant: "success", message: "Companion device paired via QR code" });
    fetchCompanionDevices();
  };

  const getCompanionQrToken = async (deviceId: string) => {
    const res = await api.post<{ message: string; data: { qrToken: string; payload: string } }>(
      `/companion/devices/${deviceId}/qr-token`
    );
    return res.data.data;
  };

  const regenerateCompanionKey = async (deviceId: string) => {
    const res = await api.post<{ message: string; pairingKey: string }>(
      `/companion/devices/${deviceId}/regenerate`
    );
    showToast({ variant: "success", message: "Companion key regenerated" });
    fetchCompanionDevices();
    return { pairingKey: res.data.pairingKey };
  };

  const handleRevokeCompanionDevice = async (deviceId: string) => {
    const isConfirmed = await confirm({
      title: "Revoke Companion Device?",
      message: "Are you sure you want to revoke this device? It will lose access until re-authenticated.",
      confirmText: "Revoke Device",
      type: "danger",
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/companion/devices/${deviceId}`);
      showToast({ variant: "success", message: "Companion device revoked" });
      fetchCompanionDevices();
    } catch (err) {
      console.error("Failed to revoke device", err);
      showToast({ variant: "error", message: "Failed to revoke device" });
    }
  };

  const handleSaveSlaConfig = async (priority: TaskPriority, hours: number) => {
    try {
      setIsSavingSla(true);
      await updateSlaConfig({ priority, responseTimeHours: hours, resolutionTimeHours: hours * 2 });
      setSlaConfigs((prev) => ({ ...prev, [priority]: hours }));
      showToast({ variant: "success", message: `SLA for ${priority} updated to ${hours} hours` });
    } catch (err) {
      console.error("Failed to save SLA config", err);
      showToast({ variant: "error", message: "Failed to save SLA configuration" });
    } finally {
      setIsSavingSla(false);
    }
  };

  return {
    user,
    activeTab,
    setActiveTab,
    apiKeyCopied,
    schemaCopied,
    instructionsCopied,
    isRegeneratingKey,
    showKey,
    setShowKey,
    companionDevices,
    isCompanionModalOpen,
    setIsCompanionModalOpen,
    selectedDeviceForRegen,
    setSelectedDeviceForRegen,
    isLoadingCompanionDevices,
    slaConfigs,
    isLoadingSla,
    isSavingSla,
    fetchCompanionDevices,
    handleCopyApiKey,
    handleCopySchema,
    handleCopyInstructions,
    handleRegenerateKey,
    createCompanionDeviceAndKey,
    pairCompanionDeviceWithKey,
    pairCompanionDeviceWithQr,
    getCompanionQrToken,
    regenerateCompanionKey,
    handleRevokeCompanionDevice,
    handleSaveSlaConfig,
  };
}
