import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  ListChecks,
  RefreshCcw,
  Shield,
  Smartphone,
  Sparkles,
  Trash2
} from 'lucide-react';

import ActionGroup from '@/components/ActionGroup';
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

  return (
    <div className="settings-panel-content">
      <div className="settings-grid">
        <SectionCard className="settings-security-card">
          <div className="settings-card-head">
            <div>
              <span className="eyebrow">Security</span>
              <h2>Sync API Key</h2>
              <p className="muted-text">Your unique key for connecting external task tools.</p>
            </div>
            <span className="settings-card-icon"><Shield size={18} /></span>
          </div>
          <div className="settings-key-container">
            <div className="settings-key-display">
              <KeyRound className="muted-text" size={16} />
              <code>{user?.syncApiKey || 'No key generated'}</code>
              <button className="copy-button" onClick={() => user?.syncApiKey && handleCopy(user.syncApiKey, -1)} type="button">
                {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <button
              className="secondary-button"
              disabled={isRegenerating}
              onClick={() => void handleRegenerateKey()}
              type="button"
            >
              <RefreshCcw className={isRegenerating ? 'spin' : ''} size={14} />
              {isRegenerating ? 'Regenerating...' : 'Regenerate Key'}
            </button>
          </div>
          {successMessage && <p className="success-text">{successMessage}</p>}
          {errorMessage && <p className="error-text">{errorMessage}</p>}
        </SectionCard>

        <SectionCard className="settings-companion-card">
          <div className="settings-card-head">
            <div>
              <span className="eyebrow">Devices</span>
              <h2>Companion Access</h2>
              <p className="muted-text">Manage secure keys for mobile, desktop, or voice apps.</p>
            </div>
            <span className="settings-card-icon"><Smartphone size={18} /></span>
          </div>

          {canManagePrimarySecurity ? (
            <>
              <div className="settings-companion-setup">
                <div className="form-row">
                  <label>
                    <span>Target Device Name</span>
                    <input
                      disabled={isGeneratingCompanionKey}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="My iPhone 15"
                      type="text"
                      value={deviceName}
                    />
                  </label>
                  <label>
                    <span>Category</span>
                    <select
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
                  disabled={isGeneratingCompanionKey || !deviceName.trim()}
                  onClick={() => void handleGenerateCompanionKey()}
                  type="button"
                >
                  Generate Device Key
                </button>
              </div>

              <div className="companion-device-list">
                {isLoadingDevices && <p className="muted-text">Loading secure sessions...</p>}
                {devicesError && <p className="error-text">{devicesError}</p>}
                {!isLoadingDevices && devices.length === 0 && (
                  <div className="empty-state-mini">
                    <p className="muted-text">No companion devices active.</p>
                  </div>
                )}
                {devices.map((device) => {
                  const draft = renameDrafts[device.id] || { deviceName: device.deviceName, deviceType: device.deviceType };
                  const isWorking = activeDeviceActionId === device.id;

                  return (
                    <article className="companion-device-item" key={device.id}>
                      <div className="device-info">
                        <input
                          className="device-rename-input"
                          onChange={(event) => handleRenameDraftChange(device.id, 'deviceName', event.target.value)}
                          value={draft.deviceName}
                        />
                        <select
                          onChange={(event) => handleRenameDraftChange(device.id, 'deviceType', event.target.value)}
                          value={draft.deviceType}
                        >
                          <option value="mobile">Mobile</option>
                          <option value="tablet">Tablet</option>
                          <option value="desktop">Desktop</option>
                          <option value="assistant">Assistant</option>
                        </select>
                      </div>
                      <ActionGroup>
                        <button
                          className="secondary-button"
                          disabled={isWorking}
                          onClick={() => void handleUpdateDevice(device.id)}
                          type="button"
                        >
                          {isWorking ? 'Saving...' : 'Update device'}
                        </button>
                        <button
                          className="danger-button"
                          disabled={isWorking}
                          onClick={() => void handleRevokeDevice(device.id)}
                          type="button"
                        >
                          <Trash2 size={14} />
                          Revoke
                        </button>
                      </ActionGroup>
                    </article>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="settings-restricted-card">
              <span className="settings-stat-label">Restricted on companion devices</span>
              <strong>Only the main device can manage companion devices.</strong>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard className="settings-integration-card">
        <div className="settings-card-head">
          <div>
            <span className="eyebrow">A.I.</span>
            <h2>ChatGPT Integration</h2>
            <p className="muted-text">Configure a custom GPT to manage your tasks via voice or chat.</p>
          </div>
          <span className="settings-card-icon"><Sparkles size={18} /></span>
        </div>
        <div className="accordion-list settings-accordion-list">
          {chatGptIntegrationSteps.map((step, index) => {
            const isOpen = openStepIndex === index;
            const panelId = `chatgpt-step-panel-${index}`;

            return (
              <article className={`accordion-item settings-accordion-item${isOpen ? ' accordion-item-open' : ''}`} key={step.title}>
                <button
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  className="accordion-trigger"
                  onClick={() => setOpenStepIndex(isOpen ? null : index)}
                  type="button"
                >
                  <span className="accordion-copy">
                    <strong>{step.title}</strong>
                    <span>{step.summary}</span>
                  </span>
                  <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
                </button>
                <div className={`accordion-panel${isOpen ? ' accordion-panel-open' : ''}`} id={panelId}>
                  <div className="accordion-content">
                    <div className="accordion-main">
                      <div className="accordion-image">
                        <img src={step.image} alt={step.title} />
                      </div>
                      <ol className="accordion-steps">
                        {step.details.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ol>
                    </div>
                    {step.code && (
                      <div className="code-container">
                        <button className="copy-button" onClick={() => handleCopy(step.code!, index)} type="button">
                          {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        <pre className="code-block">
                          <code>{step.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>

      {generatedCompanionKey && (
        <Modal onClose={() => setGeneratedCompanionKey(null)} title="Companion Device Key">
          <div className="settings-secret-modal-body">
            <p className="muted-text">
              Key for <strong>{generatedCompanionKey.deviceName}</strong>. Copy it now; it won't be shown again.
            </p>
            <code className="settings-secret-value">{generatedCompanionKey.key}</code>
            <ActionGroup>
              <button onClick={() => void handleCopy(generatedCompanionKey.key, -2)} type="button">
                {copiedIndex === -2 ? <Check size={14} /> : <Copy size={14} />}
                Copy Key
              </button>
              <button className="secondary-button" onClick={() => setGeneratedCompanionKey(null)} type="button">
                Close
              </button>
            </ActionGroup>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SettingsPanel;
