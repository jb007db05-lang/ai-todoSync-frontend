import React, { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Key,
  FileCode,
  ShieldCheck,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import SectionCard from "@/components/SectionCard";
import { SYNC_CHATGPT_ACTION_SCHEMA, SYNC_CHATGPT_INSTRUCTION_TEXT, validateSyncActionSchema } from "@/features/sync/schema";

interface ChatGPTIntegrationSettingsProps {
  schemaCopied: boolean;
  instructionsCopied: boolean;
  onCopySchema: () => void;
  onCopyInstructions: () => void;
  onNavigateToProfile?: () => void;
}

export const ChatGPTIntegrationSettings: React.FC<ChatGPTIntegrationSettingsProps> = ({
  schemaCopied,
  instructionsCopied,
  onCopySchema,
  onCopyInstructions,
  onNavigateToProfile,
}) => {
  const [showFullInstructions, setShowFullInstructions] = useState(true);
  const [showFullSchema, setShowFullSchema] = useState(true);

  const schemaValidationErrors = validateSyncActionSchema(SYNC_CHATGPT_ACTION_SCHEMA);
  const isSchemaValid = schemaValidationErrors.length === 0;

  const handleDownloadSchema = () => {
    const blob = new Blob([SYNC_CHATGPT_ACTION_SCHEMA], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "pristine-chatgpt-openapi-schema.yaml";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Pristine Enterprise Overview Banner */}
      <div className="relative overflow-hidden rounded border border-olive-800 bg-gradient-to-r from-olive-950 via-olive-900 to-slate-900 p-5 text-white shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-olive-500/20 text-olive-200 border border-olive-500/30">
                ChatGPT Custom GPT Integration
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> OpenAPI 3.1.0 Ready
              </span>
            </div>
            <h3 className="text-base font-bold text-white">Connect Sync Todo to Your Custom ChatGPT Agent</h3>
            <p className="text-xs text-olive-300 leading-relaxed">
              Enable your Custom GPT inside ChatGPT Builder to manage projects, epics, daily tasks, and notes directly through natural language conversations.
            </p>
          </div>

          {onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition border border-white/20 cursor-pointer whitespace-nowrap self-start md:self-auto"
            >
              <Key className="w-3.5 h-3.5 text-amber-300" />
              Get Sync API Key
            </button>
          )}
        </div>
      </div>

      {/* Step-by-Step Setup Guide */}
      <SectionCard>
        <h3 className="text-sm font-bold text-olive-950 mb-1">Setup & Configuration Guide</h3>
        <p className="text-xs text-olive-600 mb-4">Follow these steps to connect ChatGPT Builder with Pristine Sync API.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Step 1 */}
          <div className="p-3.5 rounded border border-olive-200 bg-olive-50/50 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded bg-olive-800 text-white font-bold flex items-center justify-center text-[11px]">
                  1
                </span>
                <span className="text-[10px] font-mono text-olive-500">Step 1 of 3</span>
              </div>
              <h4 className="font-bold text-olive-950">Copy Sync API Key</h4>
              <p className="text-olive-700 text-[11px] leading-snug">
                Copy your API Key from <strong>Profile & API Key</strong>. It authenticates ChatGPT calls.
              </p>
            </div>
            <div className="pt-2">
              <div className="p-2 rounded bg-white border border-olive-200 text-[10px] font-mono text-olive-800 flex items-center justify-between">
                <span>Header: <code className="text-olive-900 font-bold">x-sync-api-key</code></span>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded border border-olive-200 bg-olive-50/50 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded bg-olive-800 text-white font-bold flex items-center justify-center text-[11px]">
                  2
                </span>
                <a
                  href="https://chatgpt.com/gpts/editor"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-medium text-olive-800 hover:text-olive-950 flex items-center gap-1 underline"
                >
                  Open Builder <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h4 className="font-bold text-olive-950">Create Custom GPT</h4>
              <p className="text-olive-700 text-[11px] leading-snug">
                Go to ChatGPT Builder, create a new GPT, and switch to the <strong>Configure</strong> tab.
              </p>
            </div>
            <div className="pt-2">
              <div className="p-2 rounded bg-white border border-olive-200 text-[10px] font-mono text-olive-800 flex items-center justify-between">
                <span>Tab: <code className="text-olive-900 font-bold">Configure</code></span>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded border border-olive-200 bg-olive-50/50 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="w-5 h-5 rounded bg-olive-800 text-white font-bold flex items-center justify-center text-[11px]">
                  3
                </span>
                <span className="text-[10px] font-mono text-olive-500">Step 3 of 3</span>
              </div>
              <h4 className="font-bold text-olive-950">Set Auth & Actions</h4>
              <p className="text-olive-700 text-[11px] leading-snug">
                Under <strong>Actions</strong>, set Auth to <strong>API Key (Custom)</strong> and paste the OpenAPI Schema.
              </p>
            </div>
            <div className="pt-2">
              <div className="p-2 rounded bg-white border border-olive-200 text-[10px] font-mono text-olive-800 flex items-center justify-between">
                <span>Auth: <code className="text-olive-900 font-bold">API Key (Custom)</code></span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Custom GPT Instructions Display Box */}
      <SectionCard>
        <h3 className="text-sm font-bold text-olive-950 mb-1">1. Custom GPT Instructions</h3>
        <p className="text-xs text-olive-600 mb-3">Copy and paste these instructions into your Custom GPT's Instructions field.</p>
        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded bg-olive-50 border border-olive-200 text-olive-800">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-olive-700 shrink-0" />
              <span className="font-medium text-olive-900 text-xs">
                System Instructions for Pristine Sync API workflow & CRUD rules.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowFullInstructions(!showFullInstructions)}
                className="px-3 py-1.5 rounded bg-white hover:bg-olive-100/60 text-olive-800 font-medium text-xs border border-olive-200 transition flex items-center gap-1 cursor-pointer"
              >
                {showFullInstructions ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> View Instructions
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCopyInstructions}
                className="px-3.5 py-1.5 rounded bg-olive-800 hover:bg-olive-900 text-white font-medium text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {instructionsCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Instructions
                  </>
                )}
              </button>
            </div>
          </div>

          {showFullInstructions && (
            <div className="relative rounded bg-olive-950 border border-olive-900 p-4 text-olive-100 font-mono text-[11px] leading-relaxed">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="text-[10px] text-olive-400 bg-olive-900 px-2 py-0.5 rounded border border-olive-800">
                  Markdown
                </span>
              </div>
              <pre className="overflow-x-auto max-h-72 scrollbar-thin scrollbar-thumb-olive-800 whitespace-pre-wrap pr-12">
                {SYNC_CHATGPT_INSTRUCTION_TEXT}
              </pre>
            </div>
          )}
        </div>
      </SectionCard>

      {/* OpenAPI Action Schema Display Box */}
      <SectionCard>
        <h3 className="text-sm font-bold text-olive-950 mb-1">2. ChatGPT OpenAPI Action Schema</h3>
        <p className="text-xs text-olive-600 mb-3">Copy and paste this schema into the Actions section of ChatGPT Builder.</p>
        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded bg-olive-50 border border-olive-200 text-olive-800">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-olive-700 shrink-0" />
              <div className="space-y-0.5">
                <span className="font-medium text-olive-900 text-xs">
                  OpenAPI 3.1.0 Specification
                </span>
                <div className="flex items-center gap-2 text-[11px]">
                  {isSchemaValid ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Valid Schema (6 Endpoints)
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3 h-3" /> Schema Validation Warning
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDownloadSchema}
                className="px-3 py-1.5 rounded bg-white hover:bg-olive-100/60 text-olive-800 font-medium text-xs border border-olive-200 transition flex items-center gap-1 cursor-pointer"
                title="Download OpenAPI Schema file"
              >
                <Download className="w-3.5 h-3.5" /> Download .yaml
              </button>
              <button
                type="button"
                onClick={() => setShowFullSchema(!showFullSchema)}
                className="px-3 py-1.5 rounded bg-white hover:bg-olive-100/60 text-olive-800 font-medium text-xs border border-olive-200 transition flex items-center gap-1 cursor-pointer"
              >
                {showFullSchema ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> View Schema
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCopySchema}
                className="px-3.5 py-1.5 rounded bg-olive-800 hover:bg-olive-900 text-white font-medium text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {schemaCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Schema
                  </>
                )}
              </button>
            </div>
          </div>

          {showFullSchema && (
            <div className="relative rounded bg-olive-950 border border-olive-900 p-4 text-olive-100 font-mono text-[11px] leading-relaxed">
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 bg-olive-900 px-2 py-0.5 rounded border border-olive-800 font-semibold">
                  OpenAPI 3.1.0 YAML
                </span>
              </div>
              <pre className="overflow-x-auto max-h-96 scrollbar-thin scrollbar-thumb-olive-800 whitespace-pre-wrap pr-20">
                {SYNC_CHATGPT_ACTION_SCHEMA}
              </pre>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Available Endpoints Summary */}
      <SectionCard>
        <h3 className="text-sm font-bold text-olive-950 mb-1">Supported API Operations</h3>
        <p className="text-xs text-olive-600 mb-3">Available endpoints in the OpenAPI schema.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded border border-olive-200 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-olive-950">Projects</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-olive-100 text-olive-800 font-mono border border-olive-200">5 Ops</span>
            </div>
            <p className="text-[11px] text-olive-600">List, Create, Get, Update, Delete</p>
          </div>

          <div className="p-3.5 rounded border border-olive-200 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-olive-950">Epics</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-olive-100 text-olive-800 font-mono border border-olive-200">5 Ops</span>
            </div>
            <p className="text-[11px] text-olive-600">Manage project epics & milestones</p>
          </div>

          <div className="p-3.5 rounded border border-olive-200 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-olive-950">Tasks</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-olive-100 text-olive-800 font-mono border border-olive-200">6 Ops</span>
            </div>
            <p className="text-[11px] text-olive-600">CRUD tasks & bulk task sync</p>
          </div>

          <div className="p-3.5 rounded border border-olive-200 bg-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-olive-950">Notes & Summary</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-olive-100 text-olive-800 font-mono border border-olive-200">6 Ops</span>
            </div>
            <p className="text-[11px] text-olive-600">Polymorphic notes & daily summary</p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
