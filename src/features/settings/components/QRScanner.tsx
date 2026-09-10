import React, { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, Key, RefreshCw, ShieldAlert } from "lucide-react";
import jsQR from "jsqr";

interface QRScannerProps {
  onScanSuccess: (payload: { sessionId: string; token: string }) => void;
  onFallbackToKey: () => void;
  isLoading?: boolean;
}

export function parseQrPayload(rawValue: string): { sessionId: string; token: string } | null {
  const trimmed = rawValue.trim();

  // 1. URL format (e.g., http://localhost:5173/login?mode=companion&sessionId=...&token=...)
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("sessionId=")) {
    try {
      const url = new URL(trimmed.startsWith("http") ? trimmed : `http://dummy.com/${trimmed}`);
      const sessionId = url.searchParams.get("sessionId");
      const token = url.searchParams.get("token") || url.searchParams.get("qrToken");
      if (sessionId && token) {
        return { sessionId, token };
      }
    } catch {
      // Fall through to JSON
    }
  }

  // 2. JSON format (e.g., {"type":"companion_pairing","sessionId":"...","token":"..."})
  try {
    const data = JSON.parse(trimmed);
    const sessionId = data.sessionId;
    const token = data.token || data.qrToken;
    if (sessionId && token) {
      return { sessionId, token };
    }
  } catch {
    // Invalid format
  }

  return null;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  onScanSuccess,
  onFallbackToKey,
  isLoading = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const hasProcessedRef = useRef<boolean>(false);

  const [cameraState, setCameraState] = useState<"initializing" | "active" | "connecting" | "denied" | "unavailable" | "error">("initializing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopCameraStream = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const handleRawQrPayload = useCallback(
    (rawValue: string) => {
      if (hasProcessedRef.current) return;

      const parsed = parseQrPayload(rawValue);
      if (parsed) {
        hasProcessedRef.current = true;
        stopCameraStream();
        setCameraState("connecting");
        onScanSuccess(parsed);
      } else {
        hasProcessedRef.current = true;
        stopCameraStream();
        setCameraState("error");
        setErrorMessage("Invalid QR code. Please scan a valid companion-device QR code.");
      }
    },
    [onScanSuccess, stopCameraStream]
  );

  const startCamera = useCallback(async () => {
    try {
      hasProcessedRef.current = false;
      setCameraState("initializing");
      setErrorMessage(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraState("unavailable");
        setErrorMessage("Camera access is not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraState("active");
      }

      const scanFrame = () => {
        if (hasProcessedRef.current) return;

        if (
          videoRef.current &&
          videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
          canvasRef.current
        ) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert",
            });

            if (code && code.data && !hasProcessedRef.current) {
              handleRawQrPayload(code.data);
              return;
            }
          }
        }
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      };

      scanFrame();
    } catch (err) {
      const error = err as Error;
      console.error("Camera access error:", error);
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraState("denied");
        setErrorMessage("Camera permission was denied. Please allow camera access or enter pairing key manually.");
      } else {
        setCameraState("unavailable");
        setErrorMessage("Camera is unavailable or in use by another application.");
      }
    }
  }, [handleRawQrPayload]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCameraStream();
    };
  }, [startCamera, stopCameraStream]);

  const handleScanAgain = () => {
    hasProcessedRef.current = false;
    startCamera();
  };

  const isConnecting = cameraState === "connecting" || isLoading;

  return (
    <div className="flex flex-col items-center space-y-4 font-sans text-xs">
      {/* Hidden frame buffer canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <div className="w-full relative aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border border-olive-300 shadow-md flex items-center justify-center">
        {/* Camera Video Stream */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraState === "active" ? "block" : "hidden"}`}
        />

        {/* Viewfinder Overlay */}
        {cameraState === "active" && (
          <div className="absolute inset-0 border-2 border-emerald-500/80 rounded-2xl pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 border-2 border-dashed border-emerald-400/70 rounded-xl animate-pulse" />
          </div>
        )}

        {/* Camera Initializing */}
        {cameraState === "initializing" && (
          <div className="flex flex-col items-center space-y-2 text-white p-4 text-center">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <p className="text-xs">Accessing camera...</p>
          </div>
        )}

        {/* Connecting / Authenticating Overlay (No Raw QR Payload displayed!) */}
        {isConnecting && (
          <div className="absolute inset-0 bg-olive-950/95 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 space-y-3 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
            <div>
              <p className="text-sm font-bold text-white">Connecting companion device...</p>
              <p className="text-xs text-olive-300 mt-1">Please wait while we securely link this device.</p>
            </div>
          </div>
        )}

        {/* Camera Denied / Unavailable */}
        {(cameraState === "denied" || cameraState === "unavailable") && (
          <div className="flex flex-col items-center space-y-2.5 text-amber-200 p-5 text-center bg-zinc-900/95 inset-0 absolute justify-center">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <p className="text-xs font-bold text-white">Camera Unavailable</p>
            <p className="text-[11px] text-zinc-300 leading-tight">{errorMessage}</p>
          </div>
        )}

        {/* Invalid QR Error */}
        {cameraState === "error" && (
          <div className="flex flex-col items-center space-y-3 text-rose-200 p-5 text-center bg-zinc-900/95 inset-0 absolute justify-center">
            <ShieldAlert className="w-8 h-8 text-rose-400" />
            <div>
              <p className="text-xs font-bold text-white">Invalid QR Code</p>
              <p className="text-[11px] text-zinc-300 mt-1 leading-tight">{errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={handleScanAgain}
              className="px-3.5 py-1.5 rounded-lg bg-olive-800 hover:bg-olive-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Scan Again
            </button>
          </div>
        )}
      </div>

      {/* Fallback button to Enter Key */}
      <div className="pt-2 border-t border-olive-200 w-full text-center">
        <button
          type="button"
          onClick={onFallbackToKey}
          className="text-xs font-semibold text-olive-700 hover:text-olive-950 underline flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
        >
          <Key className="w-3.5 h-3.5" />
          Can't scan? Enter Pairing Key Instead
        </button>
      </div>
    </div>
  );
};
