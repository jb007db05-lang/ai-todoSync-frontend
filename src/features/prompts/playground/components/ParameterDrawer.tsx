import React from "react";
import { X, Settings } from "lucide-react";
import { PromptParameters } from "../hooks/usePlayground";

interface ParameterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tempParams: PromptParameters;
  setTempParams: React.Dispatch<React.SetStateAction<PromptParameters>>;
  onSave: () => void;
}

export const ParameterDrawer: React.FC<ParameterDrawerProps> = ({
  isOpen,
  onClose,
  tempParams,
  setTempParams,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-bold text-gray-900">Model Parameters & Provider</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="space-y-1">
            <label className="block font-semibold text-gray-700">Temperature ({tempParams.temperature})</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={tempParams.temperature}
              onChange={(e) =>
                setTempParams((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
              }
              className="w-full accent-olive-700"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-gray-700">Max Tokens ({tempParams.maxTokens})</label>
            <input
              type="number"
              value={tempParams.maxTokens}
              onChange={(e) =>
                setTempParams((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-gray-700">Top P ({tempParams.topP})</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={tempParams.topP}
              onChange={(e) =>
                setTempParams((prev) => ({ ...prev, topP: parseFloat(e.target.value) }))
              }
              className="w-full accent-olive-700"
            />
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-gray-700">Response Format</label>
            <select
              value={tempParams.responseFormat}
              onChange={(e) =>
                setTempParams((prev) => ({ ...prev, responseFormat: e.target.value as "text" | "json" }))
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
            >
              <option value="text">Plain Text</option>
              <option value="json">JSON Object</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block font-semibold text-gray-700">AI Provider</label>
            <select
              value={tempParams.provider}
              onChange={(e) =>
                setTempParams((prev) => ({ ...prev, provider: e.target.value }))
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 rounded-lg bg-olive-700 hover:bg-olive-800 text-white font-bold text-xs transition cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
