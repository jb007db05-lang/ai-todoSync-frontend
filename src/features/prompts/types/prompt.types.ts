export type {
  IPromptVariable,
  IPromptMessage,
  PromptFolder,
  PromptParametersPayload,
  PromptItem,
  PromptVersion,
  CreatePromptPayload,
  UpdatePromptPayload,
  PlaygroundRunPayload,
  PlaygroundRunResult,
} from "@/services/prompts";

export type CreateVersionPayload = import("@/services/prompts").UpdatePromptPayload;
