import React, { useState, useEffect } from "react";
import {
  Key,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  X,
  ShieldAlert,
} from "lucide-react";
import type { CompanionDevice } from "../hooks/useSettings";
import { QRCodeDisplay } from "./QRCodeDisplay";
import api from "@/services/api";
import socketService from "@/services/socket";

interface CompanionDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateDevice: (name: string, type: string) => Promise<{ pairingKey: string; device: CompanionDevice }>;
  onRefreshDevices: () => void;
}

export const CompanionDeviceModal: React.FC<CompanionDeviceModalProps> = ({
  isOpen,
  onClose,
  onCreateDevice,
  onRefreshDevices,
}) => {
  const [mode, setMode] = useState<"select_method" | "form_key" | "one_time_key" | "show_qr">("select_method");

  // Flow A (Key Generation) State
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("mobile");
  const [oneTimeSecret, setOneTimeSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Flow B (QR Session) State
  const [qrSessionId, setQrSessionId] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [isQrPaired, setIsQrPaired] = useState(false);
  const [pairedDeviceName, setPairedDeviceName] = useState<string | undefined>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreateValid = deviceName.trim().length > 0 && deviceType.length > 0;

  const handleClose = () => {
    setOneTimeSecret(null);
    setDeviceName("");
    setDeviceType("mobile");
    setQrSessionId(null);
    setQrPayload(null);
    setQrExpiresAt(null);
    setIsQrPaired(false);
    setPairedDeviceName(undefined);
    setError(null);
    setMode("select_method");
    onClose();
  };

  // Flow A: Generate Key Submit
  const handleCreateKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreateValid) return;

    setLoading(true);
    setError(null);
    try {
      const res = await onCreateDevice(deviceName.trim(), deviceType);
      setOneTimeSecret(res.pairingKey);
      setMode("one_time_key");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate pairing key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (!oneTimeSecret) return;
    navigator.clipboard.writeText(oneTimeSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Flow B: Start QR Pairing Session
  const handleStartQrSession = async () => {
    setLoading(true);
    setError(null);
    setIsQrPaired(false);
    try {
      const res = await api.post<{
        message: string;
        data: { sessionId: string; qrToken: string; expiresAt: string; payload: string };
      }>("/companion/qr-session");
      const { sessionId, expiresAt, payload } = res.data.data;
      setQrSessionId(sessionId);
      setQrPayload(payload);
      setQrExpiresAt(expiresAt);
      setMode("show_qr");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create QR pairing session");
    } finally {
      setLoading(false);
    }
  };

  // Socket listener for real-time QR pairing completion
  useEffect(() => {
    if (mode !== "show_qr" || !qrSessionId) return;

    const handleCompanionPaired = (data: { sessionId?: string; deviceName?: string }) => {
      if (data.sessionId === qrSessionId || !data.sessionId) {
        setIsQrPaired(true);
        setPairedDeviceName(data.deviceName);
        onRefreshDevices();
        setTimeout(() => {
          handleClose();
        }, 2500);
      }
    };

    socketService.on("companion:paired", handleCompanionPaired);

    // Polling fallback
    const interval = setInterval(async () => {
      try {
        const res = await api.get<{ status: string; isUsed: boolean }>(`/companion/qr-session/${qrSessionId}`);
        if (res.data.isUsed || res.data.status === "paired") {
          setIsQrPaired(true);
          onRefreshDevices();
          setTimeout(() => {
            handleClose();
          }, 2500);
        }
      } catch {
        // ignore polling error
      }
    }, 3000);

    return () => {
      socketService.off("companion:paired", handleCompanionPaired);
      clearInterval(interval);
    };
  }, [mode, qrSessionId, onRefreshDevices]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 font-sans">
      <div className="bg-white border border-olive-200 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-olive-400 hover:text-olive-900 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Select Method */}
        {mode === "select_method" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-olive-950">Add Companion Device</h3>
              <p className="text-xs text-olive-600 mt-1">Choose how you want to connect your companion device:</p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 text-xs">
              <button
                type="button"
                onClick={() => setMode("form_key")}
                className="p-4 rounded-xl border border-olive-200 hover:border-olive-500 bg-olive-50/40 hover:bg-olive-100/50 text-left transition flex items-start gap-3.5 cursor-pointer group shadow-2xs"
              >
                <div className="w-10 h-10 rounded-xl bg-olive-900 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-olive-950 text-sm group-hover:text-olive-900">🔑 Generate Pairing Key</h4>
                  <p className="text-[11px] text-olive-600 mt-1 leading-snug">
                    Enter device details to generate a secure key to enter manually on the companion login screen.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleStartQrSession}
                disabled={loading}
                className="p-4 rounded-xl border border-olive-200 hover:border-olive-500 bg-olive-50/40 hover:bg-olive-100/50 text-left transition flex items-start gap-3.5 cursor-pointer group shadow-2xs disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-olive-950 text-sm group-hover:text-olive-900">▣ Show QR Code</h4>
                  <p className="text-[11px] text-olive-600 mt-1 leading-snug">
                    Display a WhatsApp-style QR code to scan directly from your companion device camera.
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Flow A — Form for Pairing Key */}
        {mode === "form_key" && (
          <form onSubmit={handleCreateKeySubmit} className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-olive-950">Generate Pairing Key</h3>
              <p className="text-xs text-olive-600 mt-0.5">
                Provide device details. Click <strong>Generate Key</strong> to receive a one-time credential.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-olive-800 uppercase tracking-wider mb-1.5">
                  Device Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. My iPhone, Personal Tablet"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full bg-white border border-olive-200 focus:border-olive-600 rounded-xl px-3.5 py-2.5 text-xs text-olive-950 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-olive-800 uppercase tracking-wider mb-1.5">
                  Device Type
                </label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  className="w-full bg-white border border-olive-200 focus:border-olive-600 rounded-xl px-3.5 py-2.5 text-xs text-olive-950 outline-none transition"
                >
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                  <option value="desktop">Desktop</option>
                  <option value="assistant">Voice Assistant</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-olive-200">
              <button
                type="button"
                onClick={() => setMode("select_method")}
                className="text-xs font-semibold text-olive-700 hover:text-olive-950 underline"
              >
                ← Back
              </button>

              <button
                type="submit"
                disabled={!isCreateValid || loading}
                className="px-4 py-2.5 rounded-xl bg-olive-900 hover:bg-olive-800 text-white text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-md"
              >
                <Key className="w-3.5 h-3.5" />
                {loading ? "Generating..." : "Generate Key"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Flow A — One-Time Key Display */}
        {mode === "one_time_key" && (
          <div className="space-y-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Pairing Key Generated
              </span>
              <h3 className="text-base font-bold text-olive-950 mt-2">Save Your Pairing Key</h3>
              <p className="text-xs text-olive-600 mt-0.5">
                Device: <strong>{deviceName}</strong> ({deviceType})
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-snug">
                ⚠ <strong>Warning:</strong> This key will only be shown once. Save it before closing this window.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-olive-950 border border-olive-900 text-olive-100 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-olive-400 font-bold uppercase tracking-wider">Pairing Key</span>
                <span className="text-[10px] text-emerald-400 font-semibold">One-time visibility</span>
              </div>
              <div className="p-3 bg-olive-900 rounded-lg border border-olive-800 font-bold text-emerald-400 break-all select-all font-mono text-xs text-center tracking-wider">
                {oneTimeSecret}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-olive-200">
              <button
                type="button"
                onClick={handleCopyKey}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-olive-50 text-olive-800 border border-olive-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied Key" : "Copy Key"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-xl bg-olive-900 hover:bg-olive-800 text-white text-xs font-bold transition shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Flow B — Show QR Code */}
        {mode === "show_qr" && qrPayload && qrExpiresAt && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-bold text-olive-950">Scan QR Code</h3>
              <p className="text-xs text-olive-600 mt-0.5">
                Scan this QR code from your companion device to link it instantly.
              </p>
            </div>

            <QRCodeDisplay
              payload={qrPayload}
              expiresAt={qrExpiresAt}
              onRefresh={handleStartQrSession}
              isPaired={isQrPaired}
              pairedDeviceName={pairedDeviceName}
            />

            <div className="flex items-center justify-between pt-3 border-t border-olive-200">
              <button
                type="button"
                onClick={() => setMode("select_method")}
                className="text-xs font-semibold text-olive-700 hover:text-olive-950 underline"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl bg-olive-900 hover:bg-olive-800 text-white text-xs font-bold transition shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
