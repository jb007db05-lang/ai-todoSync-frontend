import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Moon,
  Search,
  Sun
} from 'lucide-react';

import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { useTheme } from '@/context/ThemeContext';
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

const INSTALL_SNIPPET = `npm install @jamesbond007db05/events-sdk`;

const QUICK_START_SNIPPET = `import { initTracker } from '@jamesbond007db05/events-sdk';

const tracker = initTracker({
  apiKey: 'your_api_key_here',
  autoPage: true,
  debug: false
});

await tracker.track('signup_started', {
  plan: 'pro',
  source: 'landing-page'
});`;

const TRACKER_CONFIG_SNIPPET = `type TrackerConfig = {
  apiKey: string;
  batchSize?: number;
  flushIntervalMs?: number;
  sampleRate?: number;
  autoPage?: boolean;
  debug?: boolean;
  maxRetries?: number;
  requestTimeoutMs?: number;
  maxEventBytes?: number;
  maxBatchBytes?: number;
  storageKey?: string;
}`;

const ERROR_HANDLING_SNIPPET = `import {
  initTracker,
  normalizeSdkError,
  SDKValidationError
} from '@jamesbond007db05/events-sdk';

try {
  const tracker = initTracker({ apiKey: 'your_api_key_here' });
  await tracker.track('checkout_completed', { amount: 199 });
} catch (error) {
  const normalized = normalizeSdkError(error);
  console.error(normalized.code, normalized.message);

  if (error instanceof SDKValidationError) {
    // show friendly validation feedback
  }
}`;

const FUNCTION_DOCS: FunctionDoc[] = [
  {
    id: 'init-tracker',
    title: 'initTracker',
    kind: 'function',
    description:
      'Initializes shared tracker instance. Base URL is hardcoded inside SDK. Legacy `baseUrl` is ignored with deprecation warning.',
    signature: `initTracker(config: TrackerConfig | LegacyTrackerConfig): Tracker`,
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
    returns: 'Tracker instance and sets global singleton for `getTracker()`.',
    example: `const tracker = initTracker({
  apiKey: 'live_1234567890abcdef',
  autoPage: true,
  flushIntervalMs: 3000
});`,
    errors: [
      'Throws `SDKValidationError` when config is not a plain object.',
      'Throws `SDKValidationError` when `apiKey` is missing or malformed.'
    ]
  },
  {
    id: 'get-tracker',
    title: 'getTracker',
    kind: 'function',
    description: 'Returns already initialized singleton tracker.',
    signature: `getTracker(): Tracker`,
    params: [],
    returns: 'Previously initialized `Tracker` instance.',
    example: `import { initTracker, getTracker } from '@jamesbond007db05/events-sdk';

initTracker({ apiKey: 'live_1234567890abcdef' });
const tracker = getTracker();`,
    errors: ['Throws `Error` if `initTracker()` has not been called first.']
  },
  {
    id: 'track',
    title: 'tracker.track',
    kind: 'method',
    description: 'Queues anonymous event with event name and properties.',
    signature: `tracker.track(eventName: string, properties?: Record<string, unknown>): Promise<void>`,
    params: [
      {
        name: 'eventName',
        type: 'string',
        required: true,
        description: 'Canonical event name, for example `button_clicked`.'
      },
      {
        name: 'properties',
        type: 'Record<string, unknown>',
        required: false,
        defaultValue: '{}',
        description: 'Event payload stored under `properties`.'
      }
    ],
    returns: 'Promise resolved after event is queued locally.',
    example: `await tracker.track('button_clicked', {
  cta: 'Start Trial',
  location: 'hero'
});`,
    errors: ['Throws when payload exceeds max event size.']
  },
  {
    id: 'identify',
    title: 'tracker.identify',
    kind: 'method',
    description: 'Queues identify call for user traits.',
    signature: `tracker.identify(userId: string, traits?: Record<string, unknown>): Promise<void>`,
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
    example: `await tracker.identify('user_42', {
  email: 'ada@example.com',
  plan: 'pro'
});`,
    errors: ['Retries automatically on retryable network failures.']
  },
  {
    id: 'alias',
    title: 'tracker.alias',
    kind: 'method',
    description: 'Links previous identifier to stable user identifier.',
    signature: `tracker.alias(previousId: string, userId: string): Promise<void>`,
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
    example: `await tracker.alias('anon_cookie_991', 'user_42');`,
    errors: ['Retries automatically on retryable network failures.']
  },
  {
    id: 'page',
    title: 'tracker.page',
    kind: 'method',
    description: 'Sends page-view style event with optional page metadata overrides.',
    signature: `tracker.page(payload?: { url?: string; title?: string; referrer?: string; userId?: string }): Promise<void>`,
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
    example: `await tracker.page({
  title: 'Pricing',
  userId: 'user_42'
});`,
    errors: ['If `autoPage` is enabled, SDK also triggers this automatically.']
  },
  {
    id: 'track-with-user',
    title: 'tracker.trackWithUser',
    kind: 'method',
    description: 'Tracks event tied to explicit user identifier in one call.',
    signature: `tracker.trackWithUser(userId: string, eventName: string, payload?: Record<string, unknown>): Promise<void>`,
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
    example: `await tracker.trackWithUser('user_42', 'subscription_upgraded', {
  from: 'starter',
  to: 'pro'
});`,
    errors: ['Throws when payload exceeds max event size.']
  },
  {
    id: 'flush',
    title: 'tracker.flush',
    kind: 'method',
    description: 'Immediately attempts to send queued events and commands.',
    signature: `tracker.flush(): Promise<void>`,
    params: [],
    returns: 'Promise resolved after current in-flight flush completes.',
    example: `await tracker.flush();`,
    errors: ['Safe to call repeatedly. Existing in-flight flush is reused.']
  },
  {
    id: 'validate-api-key-format',
    title: 'validateApiKeyFormat',
    kind: 'function',
    description: 'Validates and normalizes API key before sending requests.',
    signature: `validateApiKeyFormat(apiKey: unknown): string`,
    params: [
      {
        name: 'apiKey',
        type: 'unknown',
        required: true,
        description: 'Value to validate.'
      }
    ],
    returns: 'Trimmed API key string.',
    example: `const apiKey = validateApiKeyFormat(process.env.PUBLIC_ANALYTICS_KEY);`,
    errors: [
      'Throws `SDKValidationError` with `API_KEY_REQUIRED` when missing.',
      'Throws `SDKValidationError` with `API_KEY_INVALID` when format is invalid.'
    ]
  },
  {
    id: 'validate-payload',
    title: 'validatePayload',
    kind: 'function',
    description: 'Generic schema-based payload validator for fail-fast guards.',
    signature: `validatePayload<T>(data: unknown, schema: Schema<T>): T`,
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
    example: `const payload = validatePayload(
  { eventName: 'signup' },
  {
    eventName: {
      required: true,
      validate: (value): value is string => typeof value === 'string',
      message: 'must be a string.'
    }
  }
);`,
    errors: ['Throws `SDKValidationError` for invalid shape, missing fields, or failed rule checks.']
  },
  {
    id: 'normalize-sdk-error',
    title: 'normalizeSdkError',
    kind: 'function',
    description: 'Converts thrown SDK errors into safe `{ message, code }` shape.',
    signature: `normalizeSdkError(error: unknown): { message: string; code: string }`,
    params: [
      {
        name: 'error',
        type: 'unknown',
        required: true,
        description: 'Caught exception value.'
      }
    ],
    returns: 'Normalized error payload safe for UI or logs.',
    example: `try {
  await tracker.track('purchase_completed');
} catch (error) {
  const normalized = normalizeSdkError(error);
  console.error(normalized.code, normalized.message);
}`,
    errors: ['Never throws.']
  },
  {
    id: 'is-non-empty-string',
    title: 'isNonEmptyString',
    kind: 'function',
    description: 'Utility type guard for non-empty strings.',
    signature: `isNonEmptyString(value: unknown): value is string`,
    params: [
      {
        name: 'value',
        type: 'unknown',
        required: true,
        description: 'Value to test.'
      }
    ],
    returns: 'True when value is trimmed non-empty string.',
    example: `if (isNonEmptyString(eventName)) {
  await tracker.track(eventName);
}`,
    errors: ['No thrown errors.']
  },
  {
    id: 'is-plain-object',
    title: 'isPlainObject',
    kind: 'function',
    description: 'Utility type guard that rejects arrays and null.',
    signature: `isPlainObject(value: unknown): value is Record<string, unknown>`,
    params: [
      {
        name: 'value',
        type: 'unknown',
        required: true,
        description: 'Value to test.'
      }
    ],
    returns: 'True when value is plain object.',
    example: `if (isPlainObject(payload)) {
  console.log(Object.keys(payload));
}`,
    errors: ['No thrown errors.']
  }
];

const TOC_ITEMS = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'quick-start', label: 'Quick Start' },
  { id: 'config', label: 'Config Shape' },
  { id: 'functions', label: 'Function Reference' },
  { id: 'examples', label: 'Real-World Examples' },
  { id: 'errors', label: 'Common Errors' }
];

const searchableText = (doc: FunctionDoc): string =>
  [
    doc.title,
    doc.description,
    doc.signature,
    ...doc.params.map((param) => `${param.name} ${param.description}`),
    doc.returns,
    ...doc.errors
  ]
    .join(' ')
    .toLowerCase();

function SdkDocsPage(): JSX.Element {
  const { theme, toggleTheme } = useTheme();
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(128,145,84,0.12),transparent_30%),linear-gradient(180deg,#f7f6f1_0%,#ffffff_48%,#f6f8fb_100%)] px-4 py-8 text-zinc-800 dark:bg-[radial-gradient(circle_at_top_left,rgba(128,145,84,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_40%,#111827_100%)] dark:text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
        <aside className="lg:sticky lg:top-6 lg:h-fit lg:w-[260px]">
          <SectionCard className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-olive-600/10 text-olive-700 dark:bg-blue-500/10 dark:text-blue-300">
                <BookOpen size={18} />
              </span>
              <div>
                <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-zinc-400 dark:text-slate-500">Docs</p>
                <strong className="text-[0.95rem] text-olive-950 dark:text-slate-100">Events SDK</strong>
              </div>
            </div>

            <nav className="grid gap-2">
              {TOC_ITEMS.map((item) => (
                <a
                  key={item.id}
                  className="rounded-xl px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-olive-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                  href={`#${item.id}`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </SectionCard>
        </aside>

        <main className="flex-1 space-y-6">
          <SectionCard className="overflow-hidden p-0">
            <div className="border-b border-zinc-200 bg-white/80 px-6 py-5 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
              <PageHeader
                title="Events SDK Documentation"
                description="Production-ready guide for installation, initialization, public API, validation utilities, and migration away from user-configurable base URLs."
                actions={
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      onClick={toggleTheme}
                      type="button"
                    >
                      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                      {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </button>
                    <a
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-olive-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-olive-800 dark:bg-olive-600 dark:hover:bg-olive-500"
                      href="https://www.npmjs.com/package/@jamesbond007db05/events-sdk"
                      rel="noreferrer"
                      target="_blank"
                    >
                      Package
                      <ExternalLink size={15} />
                    </a>
                  </div>
                }
              />
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_auto]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-slate-500" size={16} />
                <input
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-olive-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-400"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search functions, parameters, errors, examples"
                  value={query}
                />
              </label>
              <div className="flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                {filteredDocs.length} results
              </div>
            </div>
          </SectionCard>

          <SectionCard className="grid gap-6" id="getting-started">
            <div>
              <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.16em] text-olive-600 dark:text-blue-400">Getting Started</p>
              <h2 className="m-0 text-2xl font-bold text-olive-950 dark:text-slate-100">Install, initialize, ship events</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-800/80">
                  <h3 className="m-0 text-base font-bold text-olive-950 dark:text-slate-100">1. Install package</h3>
                  <p className="mb-0 mt-2 text-sm leading-6 text-zinc-600 dark:text-slate-400">
                    Use npm in your frontend app. SDK ships browser-focused tracking APIs.
                  </p>
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
                    Call <code>initTracker()</code> once at app bootstrap. Base URL is now hardcoded internally. If old code still passes <code>baseUrl</code>, SDK logs deprecation warning and ignores it.
                  </p>
                </div>
              </div>
              <CodePanel copiedId={copiedId} id="install" onCopy={handleCopy} title="Installation">
                {INSTALL_SNIPPET}
              </CodePanel>
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

          <SectionCard className="grid gap-6" id="config">
            <div className="grid gap-2">
              <h2 className="m-0 text-xl font-bold text-olive-950 dark:text-slate-100">Initialization Config</h2>
              <p className="m-0 text-sm leading-6 text-zinc-600 dark:text-slate-400">
                Supported public config shape. No `baseUrl` override in active API. Legacy `baseUrl` remains tolerated only for migration.
              </p>
            </div>
            <CodePanel copiedId={copiedId} id="config-shape" onCopy={handleCopy} title="TrackerConfig">
              {TRACKER_CONFIG_SNIPPET}
            </CodePanel>
          </SectionCard>

          <div className="space-y-5" id="functions">
            <div className="grid gap-2">
              <h2 className="m-0 text-2xl font-bold text-olive-950 dark:text-slate-100">Function Reference</h2>
              <p className="m-0 text-sm leading-6 text-zinc-600 dark:text-slate-400">
                Full public API coverage. Search filters by names, descriptions, parameters, signatures, and common errors.
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
                  <a
                    className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-olive-950 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    href={`#${doc.id}`}
                  >
                    #{doc.id}
                  </a>
                </div>

                <CodePanel copiedId={copiedId} id={`${doc.id}-signature`} onCopy={handleCopy} title="Signature">
                  {doc.signature}
                </CodePanel>

                <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-slate-700">
                  <div className="grid grid-cols-[1.2fr_0.9fr_0.7fr_0.8fr_2fr] bg-zinc-50 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:bg-slate-800 dark:text-slate-400">
                    <div className="px-4 py-3">Parameter</div>
                    <div className="px-4 py-3">Type</div>
                    <div className="px-4 py-3">Required</div>
                    <div className="px-4 py-3">Default</div>
                    <div className="px-4 py-3">Description</div>
                  </div>
                  <div className="divide-y divide-zinc-200 dark:divide-slate-700">
                    {doc.params.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-zinc-500 dark:text-slate-400">No parameters.</div>
                    ) : (
                      doc.params.map((param) => (
                        <div className="grid grid-cols-[1.2fr_0.9fr_0.7fr_0.8fr_2fr] text-sm" key={`${doc.id}-${param.name}`}>
                          <div className="px-4 py-4 font-mono text-olive-950 dark:text-slate-100">{param.name}</div>
                          <div className="px-4 py-4 text-zinc-600 dark:text-slate-300">{param.type}</div>
                          <div className="px-4 py-4 text-zinc-600 dark:text-slate-300">{param.required ? 'Yes' : 'No'}</div>
                          <div className="px-4 py-4 text-zinc-500 dark:text-slate-400">{param.defaultValue ?? '—'}</div>
                          <div className="px-4 py-4 text-zinc-600 dark:text-slate-300">{param.description}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                  <CodePanel copiedId={copiedId} id={`${doc.id}-example`} onCopy={handleCopy} title="Example">
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
                {`const tracker = initTracker({
  apiKey: 'live_1234567890abcdef',
  autoPage: true
});

await tracker.identify('user_42', {
  role: 'owner',
  workspace: 'northstar'
});

await tracker.track('workspace_created', {
  template: 'product-ops'
});

await tracker.flush();`}
              </CodePanel>
              <CodePanel copiedId={copiedId} id="example-auth" onCopy={handleCopy} title="Anonymous to Authenticated">
                {`const tracker = initTracker({ apiKey: 'live_1234567890abcdef' });

await tracker.track('pricing_viewed', {
  source: 'landing'
});

await tracker.alias('anon_browser_id', 'user_42');
await tracker.identify('user_42', {
  email: 'ada@example.com'
});

await tracker.trackWithUser('user_42', 'checkout_completed', {
  amount: 199,
  currency: 'USD'
});`}
              </CodePanel>
            </div>
          </SectionCard>

          <SectionCard className="grid gap-6" id="errors">
            <div className="grid gap-2">
              <h2 className="m-0 text-xl font-bold text-olive-950 dark:text-slate-100">Common Errors and Solutions</h2>
              <p className="m-0 text-sm leading-6 text-zinc-600 dark:text-slate-400">
                Use normalized errors in UI and logs. Do not leak secret values.
              </p>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <CodePanel copiedId={copiedId} id="error-snippet" onCopy={handleCopy} title="Error Handling">
                {ERROR_HANDLING_SNIPPET}
              </CodePanel>
              <div className="grid gap-3">
                {[
                  ['API_KEY_REQUIRED', 'Pass non-empty `apiKey` to `initTracker()`.'],
                  ['API_KEY_INVALID', 'Use real node key from Event Tracking page.'],
                  ['PAYLOAD_INVALID', 'Send plain object to `validatePayload()`.'],
                  ['Event payload too large', 'Reduce nested payload size or split event shape.'],
                  ['Tracker not initialized', 'Call `initTracker()` before `getTracker()`.']
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
        </main>
      </div>
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
          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          onClick={() => void onCopy(children, id)}
          type="button"
        >
          {copiedId === id ? <Check size={13} /> : <Copy size={13} />}
          {copiedId === id ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-slate-950 p-4 text-[0.82rem] leading-7 text-slate-100">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export default SdkDocsPage;
