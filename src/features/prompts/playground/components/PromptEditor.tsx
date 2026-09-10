import React from "react";
import { AlignLeft, Code, Plus, Trash2 } from "lucide-react";
import { IPromptMessage } from "@/services/prompts";

interface PromptEditorProps {
  editorMode: "blocks" | "raw";
  setEditorMode: (mode: "blocks" | "raw") => void;
  messages: IPromptMessage[];
  setMessages: React.Dispatch<React.SetStateAction<IPromptMessage[]>>;
  body: string;
  setBody: (body: string) => void;
  isEditingPromptContent: boolean;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  editorMode,
  setEditorMode,
  messages,
  setMessages,
  body,
  setBody,
  isEditingPromptContent,
}) => {
  const handleAddMessage = () => {
    setMessages((prev) => [...prev, { role: "user", content: "" }]);
  };

  const handleRemoveMessage = (index: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMessageChange = (index: number, field: "role" | "content", val: string) => {
    setMessages((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, [field]: val } : msg))
    );
  };

  return (
    <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          Prompt Content Editor
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-[11px]">
          <button
            type="button"
            onClick={() => setEditorMode("blocks")}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 font-medium ${
              editorMode === "blocks"
                ? "bg-white text-gray-900 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" /> Structured Messages
          </button>
          <button
            type="button"
            onClick={() => setEditorMode("raw")}
            className={`px-2.5 py-1 rounded-md transition flex items-center gap-1.5 font-medium ${
              editorMode === "raw"
                ? "bg-white text-gray-900 shadow-2xs font-bold"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Raw Text Body
          </button>
        </div>
      </div>

      {editorMode === "blocks" ? (
        <div className="space-y-3">
          {messages.map((msg, index) => (
            <div key={index} className="p-3 rounded-xl border border-gray-200 bg-gray-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <select
                  value={msg.role}
                  onChange={(e) => handleMessageChange(index, "role", e.target.value as "system" | "user" | "assistant")}
                  className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold text-gray-800"
                  disabled={!isEditingPromptContent}
                >
                  <option value="system">SYSTEM</option>
                  <option value="user">USER</option>
                  <option value="assistant">ASSISTANT</option>
                </select>
                {messages.length > 1 && isEditingPromptContent && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMessage(index)}
                    className="p-1 text-gray-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <textarea
                value={msg.content}
                onChange={(e) => handleMessageChange(index, "content", e.target.value)}
                placeholder={`Enter ${msg.role} template message content...`}
                rows={3}
                className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs text-gray-950 focus:outline-none focus:border-olive-500 font-mono"
              />
            </div>
          ))}
          {isEditingPromptContent && (
            <button
              type="button"
              onClick={handleAddMessage}
              className="px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Message Block
            </button>
          )}
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Enter complete raw prompt template text here..."
          rows={8}
          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs text-gray-950 focus:outline-none focus:border-olive-500 font-mono leading-relaxed"
        />
      )}
    </div>
  );
};
