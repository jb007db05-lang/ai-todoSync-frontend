import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  RefreshCcw,
  Shield,
  Smartphone,
  Sparkles,
  Trash2
} from 'lucide-react';

import Modal from '@/components/Modal';
import SectionCard from '@/components/SectionCard';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

import step1 from '@/assets/gptIntegration/step1.png';
import step2 from '@/assets/gptIntegration/step2.png';
import step3 from '@/assets/gptIntegration/step3.png';
import step4 from '@/assets/gptIntegration/step4.png';
import step5 from '@/assets/gptIntegration/step5.png';
import step6 from '@/assets/gptIntegration/step6.png';

interface RegenerateSyncKeyResponse {
  message: string;
  data: {
    syncApiKey: string;
  };
}

interface CompanionDevice {
  id: string;
  deviceName: string;
  deviceType: string;
  status: 'active' | 'revoked';
  createdAt?: string;
  updatedAt?: string;
  revokedAt?: string | null;
}

interface CompanionDevicesResponse {
  message: string;
  data: {
    devices: CompanionDevice[];
  };
}

interface CompanionKeyResponse {
  message: string;
  data: {
    key: string;
    maxCompanionDevices: number;
    activeCompanionDevices: number;
  };
}

const chatGptInstructionText = String.raw`
You are a task assistant connected to Todo Sync API.

You must work the same way in both:
- the integrated AI app inside Todo Sync
- the external portal or custom GPT connected through actions

BEHAVIOR:

TASK FLOW:
- If the user wants to add one task, create one reminder, or save one action item:
  → call syncSingleTask
  → extract a clean, short, actionable task title
  → include date when the user provides one
  → include project when the user specifies one
  → include a task note when the user provides extra task-specific context
  → include subtasks when the user specifies them
  → include subtask notes when the user provides extra subtask-specific context

- If the user provides multiple tasks in one request:
  → call syncTasks
  → split them into clear individual tasks
  → preserve any provided dates, projects, epics, statuses, notes, and subtasks

- If the user asks to list, show, fetch, review, or check tasks:
  → call fetchTasks
  → include date when the user asks for a specific day

- If the user asks to list or check projects:
  → call fetchProjects

- If the user asks to list or check epics for a project:
  → call fetchProjects first if the project id is not already known
  → call fetchProjectEpics for the selected project

- If the user wants a task assigned to an epic:
  → ensure the project is known
  → fetch epics for that project
  → use the returned epic id
  → never invent epic ids
  → never send an epic without a matching project

- If the user asks to list, review, or fetch notes for a project:
  → call fetchProjectNotes

- If the user asks to create a note for a project:
  → call createProjectNote

- If the user asks to open a single note:
  → call fetchNote

- If the user asks to edit or update an existing note:
  → call updateNote

- If the user asks to append more content to an existing note:
  → call updateNote
  → send appendContent: true so the new content is added without replacing the existing note

- If the user asks for progress, counts, status breakdown, or daily overview:
  → call fetchTaskSummary
  → include date when the user asks for a specific day

- If the user asks to create a project:
  → do not invent a separate project-creation action
  → create the project implicitly by creating a task with the project field, because the available schema only exposes project fetch plus task sync actions

RULES:
- Always use the Todo Sync API for both creation and fetching
- Behave consistently in both the portal and the integrated AI app
- Keep task titles concise, meaningful, and action-oriented
- Remove filler words and preserve only the actionable intent
- Use only these available actions: syncSingleTask, syncTasks, fetchTasks, fetchProjects, fetchProjectEpics, fetchProjectNotes, createProjectNote, fetchNote, updateNote, fetchTaskSummary
- If a request contains a date, include it in the API call when relevant
- If the request is slightly ambiguous, infer the most reasonable action without unnecessary back-and-forth
`;

const chatGptActionSchema = String.raw`openapi: 3.1.0
info:
  title: Todo Sync API
  version: 1.0.0
servers:
  - url: https://ai-todosync-backend.onrender.com
paths:
  /api/sync/tasks:
    get:
      operationId: fetchTasks
      summary: Fetch tasks
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: date
          required: false
          schema:
            type: string
            pattern: '^\d{4}-\d{2}-\d{2}$'
      responses:
        "200":
          description: Task list fetched
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchTasksResponse'

  /api/sync/projects:
    get:
      operationId: fetchProjects
      summary: Fetch projects
      security:
        - SyncApiKey: []
      responses:
        "200":
          description: Project list fetched
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchProjectsResponse'

  /api/sync/projects/{projectId}/epics:
    get:
      operationId: fetchProjectEpics
      summary: Fetch epics for a project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Epic list fetched
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchEpicsResponse'

  /api/sync/projects/{projectId}/notes:
    get:
      operationId: fetchProjectNotes
      summary: Fetch notes for a project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Project notes fetched
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchProjectNotesResponse'
    post:
      operationId: createProjectNote
      summary: Create a note for a project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectNoteRequest'
      responses:
        "201":
          description: Note created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NoteResponse'

  /api/sync/notes/{id}:
    get:
      operationId: fetchNote
      summary: Fetch a single note
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Note fetched
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NoteResponse'
    put:
      operationId: updateNote
      summary: Update or append to a note
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateNoteRequest'
      responses:
        "200":
          description: Note updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NoteResponse'

  /api/sync/summary:
    get:
      operationId: fetchTaskSummary
      summary: Fetch task summary
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: date
          required: false
          schema:
            type: string
            pattern: '^\d{4}-\d{2}-\d{2}$'
      responses:
        "200":
          description: Task summary fetched
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchSummaryResponse'

  /api/sync/single:
    post:
      operationId: syncSingleTask
      summary: Create a single task
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SyncSingleTaskRequest'
      responses:
        "201":
          description: Task synced successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SyncSingleTaskResponse'

  /api/sync:
    post:
      operationId: syncTasks
      summary: Create multiple tasks
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SyncTasksRequest'
      responses:
        "201":
          description: Tasks synced successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SyncTasksResponse'

components:
  securitySchemes:
    SyncApiKey:
      type: apiKey
      in: header
      name: x-sync-api-key
  schemas:
    SyncSingleTaskRequest:
      type: object
      additionalProperties: false
      required: [title]
      properties:
        title:
          type: string
        description:
          type: string
        note:
          type: string
        status:
          $ref: '#/components/schemas/TaskStatus'
        source:
          type: string
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
        project:
          $ref: '#/components/schemas/SyncProjectInput'
        epic:
          type: string
        subtasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncSubtaskInput'

    SyncTasksRequest:
      type: object
      additionalProperties: false
      required: [tasks]
      properties:
        tasks:
          type: array
          minItems: 1
          maxItems: 100
          items:
            $ref: '#/components/schemas/SyncTaskInput'
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
        source:
          type: string

    SyncTaskInput:
      type: object
      additionalProperties: false
      required: [title]
      properties:
        title:
          type: string
        description:
          type: string
        note:
          type: string
        status:
          $ref: '#/components/schemas/TaskStatus'
        source:
          type: string
        project:
          $ref: '#/components/schemas/SyncProjectInput'
        epic:
          type: string
        subtasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncSubtaskInput'

    SyncProjectInput:
      oneOf:
        - type: string
        - type: object
          additionalProperties: false
          required: [name]
          properties:
            name:
              type: string

    SyncSubtaskInput:
      type: object
      additionalProperties: false
      required: [title]
      properties:
        title:
          type: string
        note:
          type: string
        status:
          $ref: '#/components/schemas/SubtaskStatus'
        completed:
          type: boolean
        completedAt:
          type: string
          format: date-time

    CreateProjectNoteRequest:
      type: object
      additionalProperties: false
      required: [title, content]
      properties:
        title:
          type: string
        content:
          type: string

    UpdateNoteRequest:
      type: object
      additionalProperties: false
      required: [content]
      properties:
        title:
          type: string
        content:
          type: string
        appendContent:
          type: boolean

    TaskStatus:
      type: string
      enum: [pending, in_progress, in_review, completed, rolled_over, done]

    SubtaskStatus:
      type: string
      enum: [pending, in_progress, in_review, completed, done]

    SyncSubtaskResponse:
      type: object
      additionalProperties: false
      required: [id, title, status, completed, completedAt]
      properties:
        id:
          type: string
        title:
          type: string
        note:
          type: string
        status:
          type: string
          enum: [pending, in_progress, in_review, completed]
        completed:
          type: boolean
        completedAt:
          type: string
          format: date-time
          nullable: true

    ProjectResponseItem:
      type: object
      additionalProperties: false
      required: [id, name, userId]
      properties:
        id:
          type: string
        name:
          type: string
        userId:
          type: string

    EpicResponseItem:
      type: object
      additionalProperties: false
      required: [id, name, projectId, status, order]
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        projectId:
          type: string
        status:
          type: string
          enum: [planned, active, completed, archived]
        order:
          type: integer

    NoteItem:
      type: object
      additionalProperties: false
      required: [id, projectId, title, content]
      properties:
        id:
          type: string
        projectId:
          type: string
        title:
          type: string
        content:
          type: string

    TaskSummaryResponseItem:
      type: object
      additionalProperties: false
      required: [total, pending, inProgress, inReview, completed, rolledOver]
      properties:
        total:
          type: integer
        pending:
          type: integer
        inProgress:
          type: integer
        inReview:
          type: integer
        completed:
          type: integer
        rolledOver:
          type: integer
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'

    SyncTaskResponseItem:
      type: object
      additionalProperties: false
      required: [id, title, date, status, projectId, epicId, subtasks]
      properties:
        id:
          type: string
        title:
          type: string
        description:
          type: string
        note:
          type: string
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
        status:
          type: string
          enum: [pending, in_progress, in_review, completed, rolled_over]
        source:
          type: string
        projectId:
          type: string
          nullable: true
        epicId:
          type: string
          nullable: true
        subtasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncSubtaskResponse'

    SyncSingleTaskResponse:
      type: object
      additionalProperties: false
      required: [message, date, task]
      properties:
        message:
          type: string
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
        task:
          $ref: '#/components/schemas/SyncTaskResponseItem'

    SyncTasksResponse:
      type: object
      additionalProperties: false
      required: [message, date, synced, tasks]
      properties:
        message:
          type: string
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
        synced:
          type: integer
        tasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncTaskResponseItem'

    FetchTasksResponse:
      type: object
      additionalProperties: false
      required: [message, date, tasks]
      properties:
        message:
          type: string
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
        tasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncTaskResponseItem'

    FetchProjectsResponse:
      type: object
      additionalProperties: false
      required: [message, projects]
      properties:
        message:
          type: string
        projects:
          type: array
          items:
            $ref: '#/components/schemas/ProjectResponseItem'

    FetchEpicsResponse:
      type: object
      additionalProperties: false
      required: [message, epics]
      properties:
        message:
          type: string
        epics:
          type: array
          items:
            $ref: '#/components/schemas/EpicResponseItem'

    FetchProjectNotesResponse:
      type: object
      additionalProperties: false
      required: [message, notes]
      properties:
        message:
          type: string
        notes:
          type: array
          items:
            $ref: '#/components/schemas/NoteItem'

    FetchSummaryResponse:
      type: object
      additionalProperties: false
      required: [message, date, summary]
      properties:
        message:
          type: string
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
        summary:
          $ref: '#/components/schemas/TaskSummaryResponseItem'

    NoteResponse:
      type: object
      additionalProperties: false
      required: [message, note]
      properties:
        message:
          type: string
        note:
          $ref: '#/components/schemas/NoteItem'`;

const chatGptIntegrationSteps = [
  {
    title: "Step 1: Open GPTs from ChatGPT sidebar",
    summary: "Navigate to the GPTs section to access and create custom GPTs.",
    details: [
      "From the ChatGPT home page, look at the left sidebar.",
      "Find the option labeled 'GPTs'.",
      "Click 'GPTs' to open the GPT explorer page.",
      "This section allows you to browse, manage, and create your own GPTs."
    ],
    image: step1
  },
  {
    title: "Step 2: Click on Create to start a new GPT",
    summary: "Start building your custom GPT by clicking the Create button on the GPTs page.",
    details: [
      "On the GPTs explorer page, look at the top-right corner.",
      "Click the '+ Create' button next to 'My GPTs'.",
      "This opens the GPT Builder interface.",
      "You’ll be taken to the screen where you configure your custom GPT."
    ],
    image: step2
  },
  {
    title: "Step 3: Configure your GPT details",
    summary: "Fill in the basic configuration including name, description, and instructions to define your GPT’s behavior.",
    details: [
      "In the Configure tab, enter a name for your GPT.",
      "Add a short description explaining what your GPT does.",
      "Upload a logo if you want one.",
      "Paste the following instructions:"
    ],
    code: chatGptInstructionText,
    image: step3
  },
  {
    title: "Step 4: Add actions and connect your API",
    summary: "Create a new action and paste your OpenAPI schema to connect your backend.",
    details: [
      "Scroll down to the bottom of the Configure page.",
      "Click on 'Create new action'.",
      "A new screen will open with Authentication and Schema fields.",
      "You will configure API Key authentication for this action in the next step.",
      "Copy and paste the following schema into the Schema field:"
    ],
    code: chatGptActionSchema,
    image: step4
  },
  {
    title: "Step 5: Configure API authentication",
    summary: "Set up API key authentication so your GPT can securely call your backend.",
    details: [
      "In the Authentication settings, select 'API Key'.",
      "Enter your sync API key from the app settings.",
      "Under Auth Type, select 'Custom'.",
      "In 'Custom Header Name', enter: x-sync-api-key",
      "Click 'Save' to apply the authentication settings."
    ],
    image: step5
  },
  {
    title: "Step 6: Create your GPT",
    summary: "Finalize and create your custom GPT with the configured settings.",
    details: [
      "Review all your configurations including instructions, actions, and authentication.",
      "Click the 'Create' button at the top right.",
      "Select Create App For Only Me.",
      "Your custom GPT will now be created and ready to use.",
      "You can immediately start testing tasks, epics, project notes, and summary queries."
    ],
    image: step6
  }
];

function SettingsPanel(): JSX.Element {
  const { refreshUser, session, user } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openStepIndex, setOpenStepIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [devices, setDevices] = useState<CompanionDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(false);
  const [devicesError, setDevicesError] = useState<string | null>(null);
  const [isGeneratingCompanionKey, setIsGeneratingCompanionKey] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceType, setDeviceType] = useState<string>('mobile');
  const [renameDrafts, setRenameDrafts] = useState<Record<string, { deviceName: string; deviceType: string }>>({});
  const [activeDeviceActionId, setActiveDeviceActionId] = useState<string | null>(null);
  const [generatedCompanionKey, setGeneratedCompanionKey] = useState<{
    key: string;
    deviceName: string;
  } | null>(null);
  const canManagePrimarySecurity = session?.deviceType === 'primary';

  const loadDevices = async (): Promise<void> => {
    setIsLoadingDevices(true);
    setDevicesError(null);
    try {
      const response = await api.get<CompanionDevicesResponse>('/companion/devices');
      setDevices(response.data.data.devices);
    } catch {
      setDevicesError('Unable to load companion devices.');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (canManagePrimarySecurity) {
      void loadDevices();
    }
  }, [canManagePrimarySecurity]);

  const handleRegenerateKey = async (): Promise<void> => {
    if (!confirm('Are you sure you want to regenerate your sync API key? Any existing GPT integrations using this key will stop working immediately.')) {
      return;
    }

    setIsRegenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await api.post<RegenerateSyncKeyResponse>('/auth/regenerate-api-key');
      console.log('Sync key regenerated:', response.data);
      await refreshUser();
      setSuccessMessage('Sync API key regenerated successfully.');
    } catch {
      setErrorMessage('Unable to regenerate sync API key right now.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateCompanionKey = async (): Promise<void> => {
    if (!deviceName.trim()) {
      setErrorMessage('Device name is required to generate a companion key.');
      return;
    }

    setIsGeneratingCompanionKey(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await api.post<CompanionKeyResponse>('/companion/key', {
        deviceName: deviceName.trim(),
        deviceType
      });
      setGeneratedCompanionKey({
        key: response.data.data.key,
        deviceName: deviceName.trim()
      });
      setDeviceName('');
      void loadDevices();
    } catch {
      setErrorMessage('Unable to generate companion key right now.');
    } finally {
      setIsGeneratingCompanionKey(false);
    }
  };

  const handleUpdateDevice = async (deviceId: string): Promise<void> => {
    const draft = renameDrafts[deviceId];
    if (!draft || !draft.deviceName.trim()) return;

    setActiveDeviceActionId(deviceId);
    try {
      await api.patch(`/companion/devices/${deviceId}`, {
        deviceName: draft.deviceName.trim(),
        deviceType: draft.deviceType
      });
      setRenameDrafts((current) => {
        const next = { ...current };
        delete next[deviceId];
        return next;
      });
      void loadDevices();
    } catch {
      setErrorMessage('Unable to update device.');
    } finally {
      setActiveDeviceActionId(null);
    }
  };

  const handleRevokeDevice = async (deviceId: string): Promise<void> => {
    if (!confirm('Revoke this companion device immediately? It will be signed out and unable to reconnect without a new key.')) {
      return;
    }

    setActiveDeviceActionId(deviceId);
    try {
      await api.delete(`/companion/devices/${deviceId}`);
      void loadDevices();
    } catch {
      setErrorMessage('Unable to revoke device.');
    } finally {
      setActiveDeviceActionId(null);
    }
  };

  const handleCopy = async (text: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      alert('Unable to copy to clipboard.');
    }
  };

  const handleRenameDraftChange = (deviceId: string, field: 'deviceName' | 'deviceType', value: string): void => {
    setRenameDrafts((current) => ({
      ...current,
      [deviceId]: {
        ...(current[deviceId] || {
          deviceName: devices.find((d) => d.id === deviceId)?.deviceName || '',
          deviceType: devices.find((d) => d.id === deviceId)?.deviceType || 'mobile'
        }),
        [field]: value
      }
    }));
  };

  const inputCls = 'w-full bg-white/82 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-md text-zinc-900 dark:text-slate-100 px-4 py-3.5 transition-all focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10';
  const ghostBtn = 'inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 text-sm hover:bg-zinc-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors';
  const dangerBtn = 'inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors';
  const primaryBtn = 'inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-blue-600 text-white rounded text-sm font-medium hover:bg-zinc-700 dark:hover:bg-blue-500 disabled:opacity-50 transition-colors';

  return (
    <div className="grid gap-8 p-1">
      {/* Top grid: Security + Devices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sync API Key card */}
        <SectionCard>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-blue-600 dark:text-blue-400 text-[0.72rem] tracking-[0.12em] uppercase font-semibold">Security</span>
              <h2 className="mt-1 mb-1 text-zinc-900 dark:text-slate-100">Sync API Key</h2>
              <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">Your unique key for connecting external task tools.</p>
            </div>
            <span className="flex items-center justify-center w-10 h-10 bg-blue-600/8 dark:bg-blue-400/12 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <Shield size={18} />
            </span>
          </div>

          {/* Key display */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-4">
            <KeyRound className="text-zinc-400 dark:text-slate-500 shrink-0" size={16} />
            <code className="flex-1 text-[0.85rem] text-zinc-700 dark:text-slate-300 break-all">{user?.syncApiKey || 'No key generated'}</code>
            <button
              className="flex items-center justify-center w-7 h-7 rounded text-zinc-400 dark:text-slate-500 hover:text-zinc-700 dark:hover:text-slate-200 transition-colors"
              onClick={() => user?.syncApiKey && handleCopy(user.syncApiKey, -1)}
              type="button"
            >
              {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <button
            className={ghostBtn}
            disabled={isRegenerating}
            onClick={() => void handleRegenerateKey()}
            type="button"
          >
            <RefreshCcw className={isRegenerating ? 'animate-spin' : ''} size={14} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Key'}
          </button>

          {successMessage && <p className="text-teal-600 dark:text-teal-400 m-0 text-sm mt-3">{successMessage}</p>}
          {errorMessage && <p className="text-red-600 dark:text-red-400 m-0 text-sm mt-3">{errorMessage}</p>}
        </SectionCard>

        {/* Companion Access card */}
        <SectionCard>
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <span className="text-blue-600 dark:text-blue-400 text-[0.72rem] tracking-[0.12em] uppercase font-semibold">Devices</span>
              <h2 className="mt-1 mb-1 text-zinc-900 dark:text-slate-100">Companion Access</h2>
              <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">Manage secure keys for mobile, desktop, or voice apps.</p>
            </div>
            <span className="flex items-center justify-center w-10 h-10 bg-blue-600/8 dark:bg-blue-400/12 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
              <Smartphone size={18} />
            </span>
          </div>

          {canManagePrimarySecurity ? (
            <>
              {/* Generate key form */}
              <div className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700 rounded-xl p-4 mb-4 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-slate-300">
                    <span>Target Device Name</span>
                    <input
                      className={inputCls}
                      disabled={isGeneratingCompanionKey}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="My iPhone 15"
                      type="text"
                      value={deviceName}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-medium text-zinc-700 dark:text-slate-300">
                    <span>Category</span>
                    <select
                      className={inputCls}
                      disabled={isGeneratingCompanionKey}
                      onChange={(e) => setDeviceType(e.target.value)}
                      value={deviceType}
                    >
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                      <option value="desktop">Desktop</option>
                      <option value="assistant">Voice Assistant</option>
                    </select>
                  </label>
                </div>
                <button
                  className={primaryBtn}
                  disabled={isGeneratingCompanionKey || !deviceName.trim()}
                  onClick={() => void handleGenerateCompanionKey()}
                  type="button"
                >
                  Generate Device Key
                </button>
              </div>

              {/* Device list */}
              <div className="grid gap-3">
                {isLoadingDevices && <p className="text-zinc-400 dark:text-slate-500 m-0 text-sm">Loading secure sessions...</p>}
                {devicesError && <p className="text-red-600 dark:text-red-400 m-0 text-sm">{devicesError}</p>}
                {!isLoadingDevices && devices.length === 0 && (
                  <p className="text-zinc-400 dark:text-slate-500 m-0 text-sm">No companion devices active.</p>
                )}
                {devices.map((device) => {
                  const draft = renameDrafts[device.id] || { deviceName: device.deviceName, deviceType: device.deviceType };
                  const isWorking = activeDeviceActionId === device.id;

                  return (
                    <article
                      key={device.id}
                      className="bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl p-4 grid gap-3"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className={inputCls}
                          onChange={(event) => handleRenameDraftChange(device.id, 'deviceName', event.target.value)}
                          value={draft.deviceName}
                        />
                        <select
                          className={inputCls}
                          onChange={(event) => handleRenameDraftChange(device.id, 'deviceType', event.target.value)}
                          value={draft.deviceType}
                        >
                          <option value="mobile">Mobile</option>
                          <option value="tablet">Tablet</option>
                          <option value="desktop">Desktop</option>
                          <option value="assistant">Assistant</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button className={ghostBtn} disabled={isWorking} onClick={() => void handleUpdateDevice(device.id)} type="button">
                          {isWorking ? 'Saving...' : 'Update device'}
                        </button>
                        <button className={dangerBtn} disabled={isWorking} onClick={() => void handleRevokeDevice(device.id)} type="button">
                          <Trash2 size={14} /> Revoke
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-zinc-50 dark:bg-slate-800/50 border border-zinc-200 dark:border-slate-700 rounded-xl p-5 text-center">
              <span className="text-zinc-400 dark:text-slate-500 text-sm">Restricted on companion devices</span>
              <strong className="block mt-1.5 text-zinc-700 dark:text-slate-300">Only the main device can manage companion devices.</strong>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ChatGPT Integration */}
      <SectionCard>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <span className="text-blue-600 dark:text-blue-400 text-[0.72rem] tracking-[0.12em] uppercase font-semibold">A.I.</span>
            <h2 className="mt-1 mb-1 text-zinc-900 dark:text-slate-100">ChatGPT Integration</h2>
            <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">Configure a custom GPT to manage your tasks via voice or chat.</p>
          </div>
          <span className="flex items-center justify-center w-10 h-10 bg-blue-600/8 dark:bg-blue-400/12 rounded-xl text-blue-600 dark:text-blue-400 shrink-0">
            <Sparkles size={18} />
          </span>
        </div>

        {/* Accordion steps */}
        <div className="grid gap-3">
          {chatGptIntegrationSteps.map((step, index) => {
            const isOpen = openStepIndex === index;
            const panelId = `chatgpt-step-panel-${index}`;

            return (
              <article
                key={step.title}
                className={[
                  'border border-zinc-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all',
                  isOpen ? 'bg-zinc-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-900'
                ].join(' ')}
              >
                {/* Trigger */}
                <button
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  onClick={() => setOpenStepIndex(isOpen ? null : index)}
                  type="button"
                >
                  <span className="grid gap-0.5">
                    <strong className="text-zinc-900 dark:text-slate-100 text-[0.95rem]">{step.title}</strong>
                    <span className="text-zinc-500 dark:text-slate-400 text-sm">{step.summary}</span>
                  </span>
                  <span className="flex items-center justify-center w-6 h-6 text-zinc-400 dark:text-slate-500 text-lg shrink-0">
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {/* Panel */}
                {isOpen && (
                  <div className="px-5 pb-5 grid gap-4" id={panelId}>
                    <div className="grid grid-cols-[1fr_280px] gap-6">
                      <ol className="text-zinc-700 dark:text-slate-300 text-sm list-decimal pl-4 grid gap-2">
                        {step.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ol>
                      <img
                        alt={step.title}
                        className="rounded-lg border border-zinc-200 dark:border-slate-700 w-full object-cover"
                        src={step.image}
                      />
                    </div>
                    {step.code && (
                      <div className="relative">
                        <button
                          className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-600 transition-colors"
                          onClick={() => handleCopy(step.code!, index)}
                          type="button"
                        >
                          {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                          {copiedIndex === index ? 'Copied!' : 'Copy'}
                        </button>
                        <pre className="bg-zinc-900 dark:bg-[#0d1117] text-zinc-100 text-[0.8rem] leading-relaxed rounded-xl p-5 overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </SectionCard>

      {/* Generated key modal */}
      {generatedCompanionKey && (
        <Modal onClose={() => setGeneratedCompanionKey(null)} title="Companion Device Key">
          <div className="grid gap-4">
            <p className="text-zinc-500 dark:text-slate-400 m-0 text-sm">
              Key for <strong className="text-zinc-800 dark:text-slate-200">{generatedCompanionKey.deviceName}</strong>. Copy it now; it won't be shown again.
            </p>
            <code className="block bg-zinc-900 dark:bg-[#0d1117] text-zinc-100 text-[0.85rem] rounded-xl p-4 break-all">
              {generatedCompanionKey.key}
            </code>
            <div className="flex gap-3">
              <button className={primaryBtn} onClick={() => void handleCopy(generatedCompanionKey.key, -2)} type="button">
                {copiedIndex === -2 ? <Check size={14} /> : <Copy size={14} />}
                Copy Key
              </button>
              <button className={ghostBtn} onClick={() => setGeneratedCompanionKey(null)} type="button">
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SettingsPanel;
