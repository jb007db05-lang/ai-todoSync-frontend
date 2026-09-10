import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { IPromptVariable } from "@/services/prompts";

interface VariableEditorProps {
  variablesSchema: IPromptVariable[];
  setVariablesSchema: React.Dispatch<React.SetStateAction<IPromptVariable[]>>;
  runtimeValues: Record<string, unknown>;
  setRuntimeValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  isEditingPromptContent: boolean;
}

export const VariableEditor: React.FC<VariableEditorProps> = ({
  variablesSchema,
  setVariablesSchema,
  runtimeValues,
  setRuntimeValues,
  isEditingPromptContent,
}) => {
  const handleAddVariable = () => {
    setVariablesSchema((prev) => [
      ...prev,
      { name: `var_${prev.length + 1}`, type: "string", required: true },
    ]);
  };

  const handleRemoveVariable = (index: number) => {
    setVariablesSchema((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariableChange = (index: number, field: keyof IPromptVariable, val: unknown) => {
    setVariablesSchema((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    );
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          Template Variables Schema
        </h3>
        {isEditingPromptContent && (
          <button
            type="button"
            onClick={handleAddVariable}
            className="text-xs font-bold text-olive-700 hover:text-olive-900 flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Variable
          </button>
        )}
      </div>

      {variablesSchema.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-gray-200 text-center text-gray-400 text-xs">
          No variables defined for this prompt template.
        </div>
      ) : (
        <div className="space-y-3">
          {variablesSchema.map((v, index) => (
            <div key={index} className="p-3 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={v.name}
                  onChange={(e) => handleVariableChange(index, "name", e.target.value)}
                  placeholder="Variable name"
                  disabled={!isEditingPromptContent}
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900 font-mono"
                />
                {isEditingPromptContent && (
                  <button
                    type="button"
                    onClick={() => handleRemoveVariable(index)}
                    className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                    Test Runtime Value
                  </label>
                  <input
                    type="text"
                    value={String(runtimeValues[v.name] ?? "")}
                    onChange={(e) =>
                      setRuntimeValues((prev) => ({ ...prev, [v.name]: e.target.value }))
                    }
                    placeholder={`Enter value for ${v.name}...`}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">
                    Default Schema Value
                  </label>
                  <input
                    type="text"
                    value={v.defaultValue || ""}
                    onChange={(e) => handleVariableChange(index, "defaultValue", e.target.value)}
                    placeholder="Default fallback"
                    disabled={!isEditingPromptContent}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-900"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
