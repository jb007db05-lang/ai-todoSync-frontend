import React, { useState, useEffect } from "react";
import { X, Settings, Cpu, Layers } from "lucide-react";
import { PromptParameters } from "../hooks/usePlayground";
import { getLlmProviders, getLlmModels, LlmProviderItem, LlmModelItem } from "@/services/aiProviders";

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
  const [providers, setProviders] = useState<LlmProviderItem[]>([]);
  const [models, setModels] = useState<LlmModelItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCatalog = async () => {
      try {
        setIsLoadingCatalog(true);
        const provs = await getLlmProviders();
        setProviders(provs.filter((p) => p.isEnabled));

        const currentProvider = tempParams.provider || (provs[0]?.providerId ?? "gemini");
        const mods = await getLlmModels(currentProvider);
        setModels(mods.filter((m) => m.isEnabled));
      } catch (err) {
        console.error("Failed to load LLM catalog in ParameterDrawer", err);
      } finally {
        setIsLoadingCatalog(false);
      }
    };
    fetchCatalog();
  }, [isOpen]);

  const handleProviderChange = async (newProvider: string) => {
    setTempParams((prev) => ({ ...prev, provider: newProvider }));
    try {
      const mods = await getLlmModels(newProvider);
      const enabledMods = mods.filter((m) => m.isEnabled);
      setModels(enabledMods);
      if (enabledMods.length > 0) {
        const defaultMod = enabledMods.find((m) => m.isDefault) || enabledMods[0];
        setTempParams((prev) => ({ ...prev, modelName: defaultMod.modelId }));
      }
    } catch (err) {
      console.error("Failed to fetch models for provider", err);
    }
  };

  if (!isOpen) return null;

  const currentSelectedModel = models.find((m) => m.modelId === tempParams.modelName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-700" />
            <h3 className="text-sm font-bold text-gray-900">Model & Execution Parameters</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {isLoadingCatalog ? (
            <div className="py-6 text-center text-gray-400 font-medium">Loading LLM Provider Catalog...</div>
          ) : (
            <>
              {/* Provider Selection */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gray-500" /> AI Provider
                </label>
                <select
                  value={tempParams.provider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-olive-500"
                >
                  {providers.length > 0 ? (
                    providers.map((p) => (
                      <option key={p.providerId} value={p.providerId}>
                        {p.displayName}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="groq">Groq / Local AI</option>
                    </>
                  )}
                </select>
              </div>

              {/* Model Selection */}
              <div className="space-y-1">
                <label className="block font-semibold text-gray-700 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-gray-500" /> Model Name
                </label>
                <select
                  value={tempParams.modelName}
                  onChange={(e) => setTempParams((prev) => ({ ...prev, modelName: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-olive-500"
                >
                  {models.length > 0 ? (
                    models.map((m) => (
                      <option key={m.modelId} value={m.modelId}>
                        {m.displayName} ({m.modelId})
                      </option>
                    ))
                  ) : (
                    <option value={tempParams.modelName}>{tempParams.modelName}</option>
                  )}
                </select>
                {currentSelectedModel && (
                  <div className="text-[10px] text-gray-500 font-mono flex items-center justify-between pt-1">
                    <span>Context: {currentSelectedModel.contextWindow?.toLocaleString() || 128000} tokens</span>
                    <span>Output: ${currentSelectedModel.outputPricePerMToken}/1M</span>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-4">
                {/* Temperature */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700">Temperature</label>
                    <span className="font-mono text-gray-500 font-semibold">{tempParams.temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    value={tempParams.temperature}
                    onChange={(e) =>
                      setTempParams((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-olive-700 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400">Controls randomness: 0 is strict & deterministic, 1+ is creative.</p>
                </div>

                {/* Max Tokens */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Max Tokens</label>
                  <input
                    type="number"
                    value={tempParams.maxTokens}
                    onChange={(e) =>
                      setTempParams((prev) => ({ ...prev, maxTokens: parseInt(e.target.value) || 2048 }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-mono focus:outline-none focus:border-olive-500"
                  />
                </div>

                {/* Top P */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-gray-700">Top P</label>
                    <span className="font-mono text-gray-500 font-semibold">{tempParams.topP}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={tempParams.topP}
                    onChange={(e) =>
                      setTempParams((prev) => ({ ...prev, topP: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-olive-700 cursor-pointer"
                  />
                </div>

                {/* Response Format */}
                <div className="space-y-1">
                  <label className="block font-semibold text-gray-700">Response Format</label>
                  <select
                    value={tempParams.responseFormat}
                    onChange={(e) =>
                      setTempParams((prev) => ({ ...prev, responseFormat: e.target.value as "text" | "json" }))
                    }
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs font-medium focus:outline-none focus:border-olive-500"
                  >
                    <option value="text">Plain Text</option>
                    <option value="json">Structured JSON Object</option>
                  </select>
                </div>
              </div>
            </>
          )}
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
            className="px-4 py-1.5 rounded-lg bg-olive-700 hover:bg-olive-800 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
          >
            Save Parameters
          </button>
        </div>
      </div>
    </div>
  );
};

