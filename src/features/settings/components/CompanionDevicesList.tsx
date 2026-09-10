import React from "react";
import {
  Smartphone,
  Tablet,
  Monitor,
  Info,
  Plus,
  Key,
  Trash2,
  RefreshCcw,
  Clock,
} from "lucide-react";
import SectionCard from "@/components/SectionCard";
import type { CompanionDevice } from "../hooks/useSettings";

interface CompanionDevicesListProps {
  devices: CompanionDevice[];
  isLoading: boolean;
  onOpenCreateModal: () => void;
  onOpenPairModal: () => void;
  onRegenerateKey: (device: CompanionDevice) => void;
  onRevokeDevice: (deviceId: string) => void;
}

const deviceIconMap: Record<string, React.FC<{ className?: string }>> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
  assistant: Info,
};

export const CompanionDevicesList: React.FC<CompanionDevicesListProps> = ({
  devices,
  isLoading,
  onOpenCreateModal,
  onOpenPairModal,
  onRegenerateKey,
  onRevokeDevice,
}) => {
  return (
    <SectionCard>
      <div className="space-y-4 font-sans text-xs">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-olive-200">
          <div>
            <h3 className="text-sm font-bold text-olive-950">Companion Mobile & Desktop Devices</h3>
            <p className="text-xs text-olive-600 mt-0.5">
              Manage paired secondary devices, generate pairing keys, or authorize device sessions.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenPairModal}
              className="px-3 py-1.5 rounded bg-white hover:bg-olive-50 text-olive-800 font-semibold text-xs border border-olive-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-olive-700" /> Pair Device
            </button>
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="px-3.5 py-1.5 rounded bg-olive-800 hover:bg-olive-900 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Companion Device
            </button>
          </div>
        </div>

        {/* Device Stats */}
        <div className="flex items-center justify-between text-slate-600 bg-olive-50/50 p-2.5 rounded border border-olive-200 text-xs">
          <span>
            Active Registered Devices: <strong className="text-olive-950">{devices.length}</strong>
          </span>
          <span className="text-[11px] text-olive-500 font-mono">Max limit: 5 devices</span>
        </div>

        {/* Device Listing */}
        {isLoading ? (
          <div className="p-8 text-center text-olive-500 italic text-xs">
            Syncing companion devices...
          </div>
        ) : devices.length === 0 ? (
          <div className="p-8 text-center text-olive-500 text-xs rounded border border-dashed border-olive-300 bg-olive-50/30 space-y-2">
            <p className="font-medium">No companion devices currently registered.</p>
            <p className="text-[11px] text-olive-600">
              Click <strong>Add Companion Device</strong> above to configure device credentials.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {devices.map((device) => {
              const Icon = deviceIconMap[device.deviceType] || Smartphone;
              const isPending = device.status === "pending";
              const isRevoked = device.status === "revoked";

              return (
                <div
                  key={device.id}
                  className="p-4 rounded border border-olive-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-olive-100 text-olive-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-olive-950 text-xs">{device.deviceName}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isPending
                              ? "bg-amber-100/70 text-amber-800 border-amber-300"
                              : isRevoked
                              ? "bg-rose-100/70 text-rose-800 border-rose-300"
                              : "bg-emerald-100/70 text-emerald-800 border-emerald-300"
                          }`}
                        >
                          {device.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-olive-600 font-mono">
                        <span className="capitalize">{device.deviceType}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-olive-500" />
                          Created: {device.createdAt ? new Date(device.createdAt).toLocaleDateString() : "Recently"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-olive-100">
                    {isPending && (
                      <button
                        type="button"
                        onClick={() => onRegenerateKey(device)}
                        className="px-2.5 py-1.5 rounded bg-white hover:bg-olive-50 text-olive-800 border border-olive-300 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                        title="Regenerate Pairing Key"
                      >
                        <RefreshCcw className="w-3.5 h-3.5 text-olive-700" /> Key
                      </button>
                    )}
                    {!isRevoked && (
                      <button
                        type="button"
                        onClick={() => onRevokeDevice(device.id)}
                        className="px-2.5 py-1.5 rounded border border-rose-200 hover:bg-rose-50 text-rose-700 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
};
