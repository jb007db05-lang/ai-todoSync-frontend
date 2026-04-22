import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Search
} from 'lucide-react';

import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { useToast } from '@/context/ToastContext';

interface ParamDoc {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

interface FunctionDoc {
  id: string;
  title: string;
  kind: 'function' | 'method' | 'type';
  description: string;
  signature: string;
  params: ParamDoc[];
  returns: string;
  example: string;
  errors: string[];
}

const INSTALL_SNIPPET = 'npm install @jamesbond007db05/events-sdk';

const QUICK_START_SNIPPET = "import { initTracker } from '@jamesbond007db05/events-sdk';\n\nconst tracker = initTracker({\n  apiKey: 'your_api_key_here',\n  autoPage: true,\n  debug: false\n});\n\nawait tracker.track('signup_started', {\n  plan: 'pro',\n  source: 'landing-page'\n});";

const TRACKER_CONFIG_SNIPPET = "type TrackerConfig = {\n  apiKey: string;\n  batchSize?: number;\n  flushIntervalMs?: number;\n  sampleRate?: number;\n  autoPage?: boolean;\n  debug?: boolean;\n  maxRetries?: number;\n  requestTimeoutMs?: number;\n  maxEventBytes?: number;\n  maxBatchBytes?: number;\n  storageKey?: string;\n}";

const ERROR_HANDLING_SNIPPET = "import {\n  initTracker,\n  normalizeSdkError,\n  SDKValidationError\n} from '@jamesbond007db05/events-sdk';\n\ntry {\n  const tracker = initTracker({ apiKey: 'your_api_key_here' });\n  await tracker.track('checkout_completed', { amount: 199 });\n} catch (error) {\n  const normalized = normalizeSdkError(error);\n  console.error(normalized.code, normalized.message);\n\n  if (error instanceof SDKValidationError) {\n    // show friendly validation feedback\n  }\n}";

const FUNCTION_DOCS: FunctionDoc[] = [
  {
    id: 'init-tracker',
    title: 'initTracker',
    kind: 'function',
    description:
      'Initializes shared tracker instance. Base URL is hardcoded inside SDK. Legacy baseUrl is ignored with deprecation warning.',
    signature: 'initTracker(config: TrackerConfig | LegacyTrackerConfig): Tracker',
    params: [
      {
        name: 'config.apiKey',
        type: 'string',
        required: true,
        description: 'Analytics API key used for all requests.'
      },
      {
        name: 'config.batchSize',
        type: 'number',
        required: false,
        defaultValue: '20',
        description: 'How many queued events flush in one batch.'
      },
      {
        name: 'config.flushIntervalMs',
        type: 'number',
        required: false,
        defaultValue: '5000',
        description: 'Background flush interval in milliseconds.'
      },
      {
        name: 'config.autoPage',
        type: 'boolean',
        required: false,
        defaultValue: 'false',
        description: 'Enable automatic page tracking.'
      },
      {
        name: 'config.baseUrl',
        type: 'string',
        required: false,
        defaultValue: 'deprecated',
        description: 'Deprecated. Ignored. Passing it logs a console warning only.'
      }
    ],
    returns: 'Tracker instance and sets global singleton for getTracker().',
    example: "const tracker = initTracker({\n  apiKey: 'live_1234567890abcdef',\n  autoPage: true,\n  flushIntervalMs: 3000\n});",
    errors: [
      'Throws SDKValidationError when config is not a plain object.',
      'Throws SDKValidationError when apiKey is missing or malformed.'
    ]
  },
  {
    id: 'get-tracker',
    title: 'getTracker',
    kind: 'function',
    description: 'Returns already initialized singleton tracker.',
    signature: 'getTracker(): Tracker',
    params: [],
    returns: 'Previously initialized Tracker instance.',
    example: "import { initTracker, getTracker } from '@jamesbond007db05/events-sdk';\n\ninitTracker({ apiKey: 'live_1234567890abcdef' });\nconst tracker = getTracker();",
    errors: ['Throws Error if initTracker() has not been called first.']
  },
  {
    id: 'track',
    title: 'tracker.track',
    kind: 'method',
    description: 'Queues anonymous event with event name and properties.',
    signature: 'tracker.track(eventName: string, properties?: Record<string, unknown>): Promise<void>',
    params: [
      {
        name: 'eventName',
        type: 'string',
        required: true,
        description: 'Canonical event name, for example button_clicked.'
      },
      {
        name: 'properties',
        type: 'Record<string, unknown>',
        required: false,
        defaultValue: '{}',
        description: 'Event payload stored under properties.'
      }
    ],
    returns: 'Promise resolved after event is queued locally.',
    example: "await tracker.track('button_clicked', {\n  cta: 'Start Trial',\n  location: 'hero'\n});",
    errors: ['Throws when payload exceeds max event size.']
  },
  {
    id: 'identify',
    title: 'tracker.identify',
    kind: 'method',
    description: 'Queues identify call for user traits.',
    signature: 'tracker.identify(userId: string, traits?: Record<string, unknown>): Promise<void>',
    params: [
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'Stable user identifier.'
      },
      {
        name: 'traits',
        type: 'Record<string, unknown>',
        required: false,
        defaultValue: '{}',
        description: 'Traits merged into known user profile.'
      }
    ],
    returns: 'Promise resolved after identify command is queued.',
    example: "await tracker.identify('user_42', {\n  email: 'ada@example.com',\n  plan: 'pro'\n});",
    errors: ['Retries automatically on retryable network failures.']
  },
  {
    id: 'alias',
    title: 'tracker.alias',
    kind: 'method',
    description: 'Links previous identifier to stable user identifier.',
    signature: 'tracker.alias(previousId: string, userId: string): Promise<void>',
    params: [
      {
        name: 'previousId',
        type: 'string',
        required: true,
        description: 'Anonymous or temporary identifier to merge.'
      },
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'Permanent identifier after sign-in or signup.'
      }
    ],
    returns: 'Promise resolved after alias command is queued.',
    example: "await tracker.alias('anon_cookie_991', 'user_42');",
    errors: ['Retries automatically on retryable network failures.']
  },
  {
    id: 'page',
    title: 'tracker.page',
    kind: 'method',
    description: 'Sends page-view style event with optional page metadata overrides.',
    signature: 'tracker.page(payload?: { url?: string; title?: string; referrer?: string; userId?: string }): Promise<void>',
    params: [
      {
        name: 'payload.url',
        type: 'string',
        required: false,
        description: 'Override detected page URL.'
      },
      {
        name: 'payload.title',
        type: 'string',
        required: false,
        description: 'Override detected document title.'
      },
      {
        name: 'payload.referrer',
        type: 'string',
        required: false,
        description: 'Override detected referrer.'
      },
      {
        name: 'payload.userId',
        type: 'string',
        required: false,
        description: 'Attach user identity to page event.'
      }
    ],
    returns: 'Promise resolved after page event is queued.',
    example: "await tracker.page({\n  title: 'Pricing',\n  userId: 'user_42'\n});",
    errors: ['If autoPage is enabled, SDK also triggers this automatically.']
  },
  {
    id: 'track-with-user',
    title: 'tracker.trackWithUser',
    kind: 'method',
    description: 'Tracks event tied to explicit user identifier in one call.',
    signature: 'tracker.trackWithUser(userId: string, eventName: string, payload?: Record<string, unknown>): Promise<void>',
    params: [
      {
        name: 'userId',
        type: 'string',
        required: true,
        description: 'Known user identifier.'
      },
      {
        name: 'eventName',
        type: 'string',
        required: true,
        description: 'Canonical event name.'
      },
      {
        name: 'payload',
        type: 'Record<string, unknown>',
        required: false,
        defaultValue: '{}',
        description: 'Event payload.'
      }
    ],
    returns: 'Promise resolved after command is queued.',
    example: "await tracker.trackWithUser('user_42', 'subscription_upgraded', {\n  from: 'starter',\n  to: 'pro'\n});",
    errors: ['Throws when payload exceeds max event size.']
  },
  {
    id: 'flush',
    title: 'tracker.flush',
    kind: 'method',
    description: 'Immediately attempts to send queued events and commands.',
    signature: 'tracker.flush(): Promise<void>',
    params: [],
    returns: 'Promise resolved after current in-flight flush completes.',
    example: 'await tracker.flush();',
    errors: ['Safe to call repeatedly. Existing in-flight flush is reused.']
  },
  {
    id: 'validate-api-key-format',
    title: 'validateApiKeyFormat',
    kind: 'function',
    description: 'Validates and normalizes API key before sending requests.',
    signature: 'validateApiKeyFormat(apiKey: unknown): string',
    params: [
      {
        name: 'apiKey',
        type: 'unknown',
        required: true,
        description: 'Value to validate.'
      }
    ],
    returns: 'Trimmed API key string.',
    example: 'const apiKey = validateApiKeyFormat(process.env.PUBLIC_ANALYTICS_KEY);',
    errors: [
      'Throws SDKValidationError with API_KEY_REQUIRED when missing.',
      'Throws SDKValidationError with API_KEY_INVALID when format is invalid.'
    ]
  },
  {
    id: 'validate-payload',
    title: 'validatePayload',
    kind: 'function',
    description: 'Generic schema-based payload validator for fail-fast guards.',
    signature: 'validatePayload<T>(data: unknown, schema: Schema<T>): T',
    params: [
      {
        name: 'data',
        type: 'unknown',
        required: true,
        description: 'Incoming payload.'
      },
      {
        name: 'schema',
        type: 'Schema<T>',
        required: true,
        description: 'Field validators and required flags.'
      }
    ],
    returns: 'Validated and typed payload object.',
    example: "const payload = validatePayload(\n  { eventName: 'signup' },\n  {\n    eventName: {\n      required: true,\n      validate: (value): value is string => typeof value === 'string',\n      message: 'must be a string.'\n    }\n  }\n);",
    errors: ['Throws SDKValidationError for invalid shape, missing fields, or failed rule checks.']
  },
  {
    id: 'normalize-sdk-error',
    title: 'normalizeSdkError',
    kind: 'function',
    description: 'Converts thrown SDK errors into safe { message, code } shape.',
    signature: 'normalizeSdkError(error: unknown): { message: string; code: string }',
    params: [
      {
        name: 'error',
        type: 'unknown',
        required: true,
        description: 'Caught exception value.'
      }
    ],
    returns: 'Normalized error payload safe for UI or logs.',
    example: "try {\n  await tracker.track('purchase_completed');\n} catch (error) {\n  const normalized = normalizeSdkError(error);\n  console.error(normalized.code, normalized.message);\n}",
    errors: ['Never throws.']
  }
];

const searchableText = (doc: FunctionDoc): string =>
  [
    doc.title,
    doc.description,
    doc.signature,
    ...doc.params.map((param) => param.name + ' ' + param.description),
    doc.returns,
    ...doc.errors
  ]
    .join(' ')
    .toLowerCase();

function SdkDocsPanel(): JSX.Element {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredDocs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return FUNCTION_DOCS;
    }

    return FUNCTION_DOCS.filter((doc) => searchableText(doc).includes(normalizedQuery));
  }, [query]);

  const handleCopy = async (text: string, id: string): Promise<void> => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast({ variant: 'success', message: 'Code copied.' });
    window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1600);
  };

  return (
    <div className="grid gap-6 p-2">
      <SectionCard className="overflow-hidden p-0">
        <div className="bg-white/80 px-6 py-5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
          <PageHeader
            title="Events SDK Documentation"
            description="Production-ready guide for installation, initialization, public API, and validation utilities."
            actions={
              <a
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-olive-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-olive-800 dark:bg-olive-600 dark:hover:bg-olive-500"
                href="https://www.npmjs.com/package/@jamesbond007db05/events-sdk"
                rel="noreferrer"
                target="_blank"
              >
                Package
                <ExternalLink size={15} />
              </a>
            }
          />
        </div>
      </SectionCard>

      <SectionCard className="grid gap-6" id="getting-started">
        <div>
          <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-olive-600 dark:text-blue-400">Getting Started</p>
          <h2 className="m-0 text-2xl font-bold text-olive-950 dark:text-slate-100">Install, initialize, ship events</h2>
        </div>
        <div className="w-full flex flex-col">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
              <h3 className="m-0 text-base font-bold text-olive-950 dark:text-slate-100">1. Install package</h3>
              <p className="mb-0 mt-2 text-sm leading-6 text-zinc-600 dark:text-slate-400 pb-3">
                Use npm in your frontend app. SDK ships browser-focused tracking APIs.
              </p>
              <CodePanel copiedId={copiedId} id="install" onCopy={handleCopy} title="Installation">
                {INSTALL_SNIPPET}
              </CodePanel>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
              <h3 className="m-0 text-base font-bold text-olive-950 dark:text-slate-100">2. Create API key</h3>
              <p className="mb-0 mt-2 text-sm leading-6 text-zinc-600 dark:text-slate-400">
                Open Event Tracking in app, provision a node, copy secret key once, then store it in your app config.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
              <h3 className="m-0 text-base font-bold text-olive-950 dark:text-slate-100">3. Initialize once</h3>
              <p className="mb-0 mt-2 text-sm leading-6 text-zinc-600 dark:text-slate-400">
                Call initTracker() once at app bootstrap. Base URL is hardcoded internally.
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard className="grid gap-6" id="quick-start">
        <div className="grid gap-2">
          <h2 className="m-0 text-xl font-bold text-olive-950 dark:text-slate-100">Quick Start</h2>
          <p className="m-0 text-sm leading-6 text-zinc-600 dark:text-slate-400">
            Copy-paste setup for most browser apps.
          </p>
        </div>
        <CodePanel copiedId={copiedId} id="quick-start-code" onCopy={handleCopy} title="Quick Start Example">
          {QUICK_START_SNIPPET}
        </CodePanel>
      </SectionCard>

      <div className="space-y-5" id="functions">
        <div className="grid gap-2">
          <h2 className="m-0 text-2xl font-bold text-olive-950 dark:text-slate-100">Function Reference</h2>
          <p className="m-0 text-sm leading-6 text-zinc-600 dark:text-slate-400">
            Full public API coverage.
          </p>
        </div>

        {filteredDocs.map((doc) => (
          <SectionCard className="grid gap-5" id={doc.id} key={doc.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-olive-600/10 px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-olive-700 dark:bg-blue-500/10 dark:text-blue-300">
                    {doc.kind}
                  </span>
                  <h3 className="m-0 text-xl font-bold text-olive-950 dark:text-slate-100">{doc.title}</h3>
                </div>
                <p className="m-0 max-w-3xl text-sm leading-6 text-zinc-600 dark:text-slate-400">{doc.description}</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <CodePanel copiedId={copiedId} id={doc.id + '-example'} onCopy={handleCopy} title="Example">
                {doc.example}
              </CodePanel>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <h4 className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-slate-400">Return Value</h4>
                <p className="mb-0 mt-3 text-sm leading-6 text-zinc-700 dark:text-slate-300">{doc.returns}</p>
                <div className="mt-5">
                  <h4 className="m-0 text-sm font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-slate-400">Common Errors</h4>
                  <ul className="mb-0 mt-3 space-y-2 pl-5 text-sm leading-6 text-zinc-700 dark:text-slate-300">
                    {doc.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <SectionCard className="grid gap-6" id="examples">
        <div className="grid gap-2">
          <h2 className="m-0 text-xl font-bold text-olive-950 dark:text-slate-100">Real-World Examples</h2>
          <p className="m-0 text-sm leading-6 text-zinc-600 dark:text-slate-400">
            Practical patterns you can drop into app code.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <CodePanel copiedId={copiedId} id="example-onboarding" onCopy={handleCopy} title="Onboarding Flow">
            {"const tracker = initTracker({\n  apiKey: 'live_1234567890abcdef',\n  autoPage: true\n});\n\nawait tracker.identify('user_42', {\n  role: 'owner',\n  workspace: 'northstar'\n});\n\nawait tracker.track('workspace_created', {\n  template: 'product-ops'\n});\n\nawait tracker.flush();"}
          </CodePanel>
          <CodePanel copiedId={copiedId} id="example-auth" onCopy={handleCopy} title="Anonymous to Authenticated">
            {"const tracker = initTracker({ apiKey: 'live_1234567890abcdef' });\n\nawait tracker.track('pricing_viewed', {\n  source: 'landing'\n});\n\nawait tracker.alias('anon_browser_id', 'user_42');\nawait tracker.identify('user_42', {\n  email: 'ada@example.com'\n});\n\nawait tracker.trackWithUser('user_42', 'checkout_completed', {\n  amount: 199,\n  currency: 'USD'\n});"}
          </CodePanel>
        </div>
      </SectionCard>

      <SectionCard className="grid gap-6" id="errors">
        <div className="grid gap-2">
          <h2 className="m-0 text-xl font-bold text-olive-950 dark:text-slate-100">Common Errors and Solutions</h2>
          <p className="m-0 text-sm leading-6 text-zinc-600 dark:text-slate-400">
            Use normalized errors in UI and logs.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <CodePanel copiedId={copiedId} id="error-snippet" onCopy={handleCopy} title="Error Handling">
            {ERROR_HANDLING_SNIPPET}
          </CodePanel>
          <div className="grid gap-3">
            {[
              ['API_KEY_REQUIRED', 'Pass non-empty apiKey to initTracker().'],
              ['API_KEY_INVALID', 'Use real node key from Event Tracking page.'],
              ['PAYLOAD_INVALID', 'Send plain object to validatePayload().'],
              ['Event payload too large', 'Reduce nested payload size or split event shape.'],
              ['Tracker not initialized', 'Call initTracker() before getTracker().'],
            ].map(([code, fix]) => (
              <div
                className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-800/70"
                key={code}
              >
                <strong className="font-mono text-sm text-olive-950 dark:text-slate-100">{code}</strong>
                <p className="mb-0 mt-2 text-sm leading-6 text-zinc-600 dark:text-slate-400">{fix}</p>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

function CodePanel({
  title,
  children,
  id,
  copiedId,
  onCopy
}: {
  title: string;
  children: string;
  id: string;
  copiedId: string | null;
  onCopy: (text: string, id: string) => Promise<void>;
}): JSX.Element {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <strong className="text-sm text-olive-950 dark:text-slate-100">{title}</strong>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          onClick={() => void onCopy(children, id)}
          type="button"
        >
          {copiedId === id ? <Check size={13} /> : <Copy size={13} />}
          {copiedId === id ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-slate-950 p-4 text-[0.82rem] leading-7 text-white">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default SdkDocsPanel;
