import React, { useState, useEffect } from "react";
import { X, Plus, Trash2, Code, AlignLeft } from "lucide-react";
import {
  promptService,
  PromptItem,
  PromptFolder,
  IPromptMessage,
  IPromptVariable,
} from "@/services/prompts";

interface PromptEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  folders: PromptFolder[];
  existingPrompt?: PromptItem | null;
  onSuccess: (prompt: PromptItem) => void;
}

export const PromptEditorModal: React.FC<PromptEditorModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  folders,
  existingPrompt,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [tagsInput, setTagsInput] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [visibility, setVisibility] = useState<"private" | "project" | "organization">("organization");

  const [editorMode, setEditorMode] = useState<"blocks" | "raw">("blocks");
  const [body, setBody] = useState("");
  const [messages, setMessages] = useState<IPromptMessage[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);

  const [variables, setVariables] = useState<IPromptVariable[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingPrompt) {
      setName(existingPrompt.name);
      setDescription(existingPrompt.description || "");
      setCategory(existingPrompt.category || "general");
      setTagsInput(existingPrompt.tags?.join(", ") || "");
      setFolderId(existingPrompt.folderId || "");
      setVisibility(existingPrompt.visibility || "organization");
      setBody(existingPrompt.body || "");
      setMessages(
        existingPrompt.messages && existingPrompt.messages.length > 0
          ? existingPrompt.messages
          : [{ role: "system", content: "You are a helpful assistant." }]
      );
      setVariables(existingPrompt.variables || []);
    } else {
      setName("");
      setDescription("");
      setCategory("general");
      setTagsInput("");
      setFolderId("");
      setVisibility("organization");
      setBody("");
      setMessages([{ role: "system", content: "You are a helpful assistant." }]);
      setVariables([]);
    }
  }, [existingPrompt, isOpen]);

  if (!isOpen) return null;

  const handleAddMessage = () => {
    setMessages((prev) => [...prev, { role: "user", content: "" }]);
  };

  const handleRemoveMessage = (index: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMessageChange = (index: number, field: "role" | "content", val: string) => {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, [field]: val } : msg
      )
    );
  };

  const handleAddVariable = () => {
    setVariables((prev) => [
      ...prev,
      { name: `var_${prev.length + 1}`, type: "string", required: true },
    ]);
  };

  const handleRemoveVariable = (index: number) => {
    setVariables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleVariableChange = (index: number, field: keyof IPromptVariable, val: unknown) => {
    setVariables((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: val } : v))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Prompt name is required.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      let saved: PromptItem;

      if (existingPrompt) {
        saved = await promptService.updatePrompt(workspaceId, existingPrompt._id, {
          name,
          description,
          category,
          tags,
          folderId: folderId || null,
          visibility,
          body: editorMode === "raw" ? body : "",
          messages: editorMode === "blocks" ? messages : [],
          variables,
        });
      } else {
        saved = await promptService.createPrompt(workspaceId, {
          name,
          description,
          category,
          tags,
          folderId: folderId || null,
          visibility,
          body: editorMode === "raw" ? body : "",
          messages: editorMode === "blocks" ? messages : [],
          variables,
        });
      }

      onSuccess(saved);
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }; message?: string };
      setError(errorObj.response?.data?.message || "Failed to save prompt.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-olive-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-olive-100 flex items-center justify-between bg-olive-50/50">
          <h2 className="text-base font-bold text-olive-950">
            {existingPrompt ? "Edit Prompt Template" : "Create New Prompt Template"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-olive-400 hover:text-olive-700 hover:bg-olive-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-olive-800">Prompt Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Code Review Assistant"
                className="w-full bg-olive-50/50 border border-olive-200 rounded-xl px-3 py-2 text-xs text-olive-950 focus:outline-none focus:border-olive-400"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-olive-800">Folder</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full bg-olive-50/50 border border-olive-200 rounded-xl px-3 py-2 text-xs text-olive-950 focus:outline-none focus:border-olive-400"
              >
                <option value="">No Folder (Root)</option>
                {folders.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-olive-800">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this prompt accomplishes..."
              rows={2}
              className="w-full bg-olive-50/50 border border-olive-200 rounded-xl px-3 py-2 text-xs text-olive-950 focus:outline-none focus:border-olive-400"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-olive-800">Prompt Content Editor</label>
              <div className="flex items-center gap-1 bg-olive-100/80 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setEditorMode("blocks")}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 font-medium ${
                    editorMode === "blocks"
                      ? "bg-white text-olive-900 shadow-2xs font-bold"
                      : "text-olive-600 hover:text-olive-900"
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" /> Structured Messages
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode("raw")}
                  className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 font-medium ${
                    editorMode === "raw"
                      ? "bg-white text-olive-900 shadow-2xs font-bold"
                      : "text-olive-600 hover:text-olive-900"
                  }`}
                >
                  <Code className="w-3.5 h-3.5" /> Raw Text Body
                </button>
              </div>
            </div>

            {editorMode === "blocks" ? (
              <div className="space-y-3">
                {messages.map((msg, index) => (
                  <div key={index} className="p-3 rounded-xl border border-olive-200 bg-olive-50/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <select
                        value={msg.role}
                        onChange={(e) => handleMessageChange(index, "role", e.target.value as "system" | "user" | "assistant")}
                        className="bg-white border border-olive-200 rounded-lg px-2 py-1 text-xs font-bold text-olive-800"
                      >
                        <option value="system">SYSTEM</option>
                        <option value="user">USER</option>
                        <option value="assistant">ASSISTANT</option>
                      </select>
                      {messages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMessage(index)}
                          className="p-1 text-olive-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={msg.content}
                      onChange={(e) => handleMessageChange(index, "content", e.target.value)}
                      placeholder={`Enter ${msg.role} instructions or prompt template...`}
                      rows={3}
                      className="w-full bg-white border border-olive-200 rounded-lg p-2.5 text-xs text-olive-950 focus:outline-none focus:border-olive-400 font-mono"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddMessage}
                  className="px-3 py-1.5 rounded-lg border border-dashed border-olive-300 text-olive-700 hover:bg-olive-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Message Block
                </button>
              </div>
            ) : (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter complete raw prompt template text here..."
                rows={6}
                className="w-full bg-white border border-olive-200 rounded-xl p-3 text-xs text-olive-950 focus:outline-none focus:border-olive-400 font-mono leading-relaxed"
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-olive-800">Variables Schema</label>
              <button
                type="button"
                onClick={handleAddVariable}
                className="text-xs font-bold text-olive-700 hover:text-olive-950 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Variable
              </button>
            </div>

            {variables.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-olive-200 text-center text-olive-500 text-xs">
                No template variables configured. Click 'Add Variable' to add dynamic inputs.
              </div>
            ) : (
              <div className="space-y-2">
                {variables.map((v, index) => (
                  <div key={index} className="flex items-center gap-2 p-2.5 rounded-xl border border-olive-200 bg-white">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => handleVariableChange(index, "name", e.target.value)}
                      placeholder="Variable name (e.g. topic)"
                      className="flex-1 bg-olive-50/50 border border-olive-200 rounded-lg px-2.5 py-1 text-xs text-olive-950 font-mono"
                    />
                    <select
                      value={v.type || "string"}
                      onChange={(e) => handleVariableChange(index, "type", e.target.value)}
                      className="bg-olive-50/50 border border-olive-200 rounded-lg px-2 py-1 text-xs text-olive-800"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="json">JSON</option>
                    </select>
                    <input
                      type="text"
                      value={v.defaultValue || ""}
                      onChange={(e) => handleVariableChange(index, "defaultValue", e.target.value)}
                      placeholder="Default value"
                      className="w-32 bg-olive-50/50 border border-olive-200 rounded-lg px-2.5 py-1 text-xs text-olive-950"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveVariable(index)}
                      className="p-1 text-olive-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <div className="px-6 py-3 border-t border-olive-100 flex items-center justify-end gap-2 bg-olive-50/50">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-olive-200 text-olive-700 font-semibold text-xs hover:bg-olive-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl bg-olive-900 hover:bg-black text-white font-bold text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {loading ? "Saving..." : existingPrompt ? "Update Prompt" : "Create Prompt"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptEditorModal;
