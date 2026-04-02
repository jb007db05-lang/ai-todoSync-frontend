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
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
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

const chatGptIntegrationSteps = [
  {
    title: "Step 1: Open GPTs from ChatGPT sidebar",
    summary: "Navigate to the GPTs section to access and create custom GPTs.",
    details: [
      "From the ChatGPT home (New Chat page), look at the left sidebar.",
      "Find the option labeled 'GPTs' (below Apps/Codex).",
      "Click on 'GPTs' to open the GPT explorer page.",
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
      "This will open the GPT Builder interface.",
      "You’ll be taken to a new screen where you can configure your custom GPT."
    ],
    image: step2
  },
  {
    title: "Step 3: Configure your GPT details",
    summary: "Fill in the basic configuration including name, description, and instructions to define your GPT’s behavior.",
    details: [
      "In the Configure tab, enter a name for your GPT (any name of your choice).",
      "Add a short description explaining what your GPT does.",
      "Upload logo for your GPT",
      `Instructions:`
    ],
    code: `
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
  → preserve any provided dates, projects, statuses, notes, and subtasks

- If the user asks to list, show, fetch, review, or check tasks:
  → call fetchTasks
  → include date when the user asks for a specific day

- If the user asks to list or check projects:
  → call fetchProjects

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
- Use only these available actions: syncSingleTask, syncTasks, fetchTasks, fetchProjects, fetchProjectNotes, createProjectNote, fetchNote, updateNote, fetchTaskSummary
- If a request contains a date, include it in the API call when relevant
- If the request is slightly ambiguous, infer the most reasonable action without unnecessary back-and-forth
    `,
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
    code: `openapi: 3.1.0
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
            format: date
          description: Optional YYYY-MM-DD filter
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
      description: Creates a new note inside the specified project.
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
      description: >
        Updates an existing note. If appendContent is true, the incoming content
        is added to the end of the existing note instead of replacing it.
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
            format: date
          description: Optional YYYY-MM-DD filter
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
      description: >
        Creates one task. If project is provided, the task is attached to that
        project and the project is created automatically when needed. If
        subtasks are provided, they are created under the new task. Task notes
        and subtask notes can also be included.
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
      description: >
        Creates multiple tasks in one request. Each task may include project to
        create or attach to a project, and may include subtasks to create under
        that task.
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
      required:
        - title
      description: >
        Request for creating one task. Use project to create or attach the task
        to a project, and use subtasks to create subtasks under the task.
      properties:
        title:
          type: string
          description: Short task title
        description:
          type: string
        note:
          type: string
          description: Optional task note or extra context for the task
        status:
          $ref: '#/components/schemas/TaskStatus'
        source:
          type: string
        date:
          type: string
          format: date
          description: YYYY-MM-DD
        project:
          $ref: '#/components/schemas/SyncProjectInput'
        subtasks:
          type: array
          description: Optional subtasks to create under this task.
          items:
            $ref: '#/components/schemas/SyncSubtaskInput'
      example:
        title: Implement auth refresh flow
        description: Handle token refresh for expired sessions
        note: Verify refresh token expiry edge cases before release
        status: in_progress
        date: '2026-03-31'
        project: Backend
        subtasks:
          - title: Update auth middleware
            note: Cover bearer token parsing and invalid token branches
            status: in_progress
          - title: Add refresh token tests
            note: Include expired token coverage
            status: pending

    SyncTasksRequest:
      type: object
      additionalProperties: false
      required:
        - tasks
      description: >
        Request for creating multiple tasks. Each task may include its own
        project, notes, and subtasks.
      properties:
        tasks:
          type: array
          minItems: 1
          description: >
            Tasks to create for the authenticated user. A task can belong to a
            project and can include subtasks.
          items:
            $ref: '#/components/schemas/SyncTaskInput'
        date:
          type: string
          format: date
          description: YYYY-MM-DD
        source:
          type: string
      example:
        date: '2026-03-31'
        tasks:
          - title: Finalize dashboard layout
            note: Focus on spacing and compact mobile layout
            project: Frontend
            subtasks:
              - title: Tighten spacing
                note: Align card gutters with modal padding
                status: in_review
              - title: Polish modal layout
                note: Check nested modal stacking
                status: pending
          - title: Review sync endpoints
            note: Confirm payloads support task and subtask notes
            project:
              name: Backend
            status: pending

    SyncTaskInput:
      type: object
      additionalProperties: false
      required:
        - title
      description: >
        A task input for bulk sync. Include project to place the task inside a
        project, include note for task-specific context, and include subtasks
        to create subtasks under that task.
      properties:
        title:
          type: string
          description: Task title
        description:
          type: string
        note:
          type: string
          description: Optional task note or extra context
        status:
          $ref: '#/components/schemas/TaskStatus'
        source:
          type: string
        project:
          $ref: '#/components/schemas/SyncProjectInput'
        subtasks:
          type: array
          description: Optional subtasks to create under this task.
          items:
            $ref: '#/components/schemas/SyncSubtaskInput'

    SyncProjectInput:
      description: >
        Project reference for a task. Passing a name attaches the task to that
        project. If the project does not exist for the user, it is created
        automatically. This is how project creation happens through the sync API.
      oneOf:
        - type: string
          description: Existing or new flat project name
        - type: object
          additionalProperties: false
          required:
            - name
          properties:
            name:
              type: string
              description: Existing or new flat project name

    SyncSubtaskInput:
      type: object
      additionalProperties: false
      required:
        - title
      description: Subtask to create under a task during sync.
      properties:
        title:
          type: string
        note:
          type: string
          description: Optional note or extra context for the subtask
        status:
          $ref: '#/components/schemas/SubtaskStatus'
        completed:
          type: boolean
        completedAt:
          type: string
          format: date-time

    TaskStatus:
      type: string
      enum:
        - pending
        - in_progress
        - in_review
        - completed
        - rolled_over
        - done

    SubtaskStatus:
      type: string
      enum:
        - pending
        - in_progress
        - in_review
        - completed
        - done

    SyncSubtaskResponse:
      type: object
      additionalProperties: false
      required:
        - id
        - title
        - status
        - completed
        - completedAt
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

    SyncTaskResponseItem:
      type: object
      additionalProperties: false
      required:
        - id
        - title
        - date
        - status
        - projectId
        - subtasks
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
          format: date
        status:
          type: string
          enum: [pending, in_progress, in_review, completed, rolled_over]
        source:
          type: string
        projectId:
          type: string
          nullable: true
        subtasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncSubtaskResponse'

    SyncSingleTaskResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - date
        - task
      properties:
        message:
          type: string
        date:
          type: string
          format: date
        task:
          $ref: '#/components/schemas/SyncTaskResponseItem'

    SyncTasksResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - date
        - synced
        - tasks
      properties:
        message:
          type: string
        date:
          type: string
          format: date
        synced:
          type: integer
        tasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncTaskResponseItem'

    ProjectResponseItem:
      type: object
      additionalProperties: false
      required:
        - id
        - name
        - userId
      properties:
        id:
          type: string
        name:
          type: string
        userId:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    NoteItem:
      type: object
      additionalProperties: false
      required:
        - id
        - projectId
        - title
        - content
      properties:
        id:
          type: string
        projectId:
          type: string
        title:
          type: string
        content:
          type: string
          description: Rich text HTML content
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CreateProjectNoteRequest:
      type: object
      additionalProperties: false
      required:
        - title
      properties:
        title:
          type: string
        content:
          type: string
          description: Rich text HTML content

    UpdateNoteRequest:
      type: object
      additionalProperties: false
      properties:
        title:
          type: string
        content:
          type: string
          description: Rich text HTML content
        appendContent:
          type: boolean
          description: If true, append new content instead of replacing the note.

    NoteResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - note
      properties:
        message:
          type: string
        note:
          $ref: '#/components/schemas/NoteItem'

    TaskSummaryResponseItem:
      type: object
      additionalProperties: false
      required:
        - total
        - pending
        - inProgress
        - inReview
        - completed
        - rolledOver
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
          format: date

    FetchTasksResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - date
        - tasks
      properties:
        message:
          type: string
        date:
          type: string
          format: date
        tasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncTaskResponseItem'

    FetchProjectsResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - projects
      properties:
        message:
          type: string
        projects:
          type: array
          items:
            $ref: '#/components/schemas/ProjectResponseItem'

    FetchProjectNotesResponse:
      type: object
      additionalProperties: false
      required:
        - message
        - notes
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
      required:
        - message
        - date
        - summary
      properties:
        message:
          type: string
        date:
          type: string
          format: date
        summary:
          $ref: '#/components/schemas/TaskSummaryResponseItem'`,
    image: step4
  },
  {
    title: "Step 5: Configure API authentication",
    summary: "Set up API key authentication so your GPT can securely call your backend.",
    details: [
      "In the Authentication settings, select 'API Key'.",
      "Enter your sync API key (from your app settings-> click the copy sync key button).",
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
      "Select Create App For Only Me",
      "Your custom GPT will now be created and ready to use.",
      "You can immediately start testing it by adding tasks."
    ],
    image: step6
  }
];

function SettingsPage(): JSX.Element {
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
      const response = await api.get<CompanionDevicesResponse>('/auth/devices');
      const nextDevices = response.data.data.devices;
      setDevices(nextDevices);
      setRenameDrafts(
        nextDevices.reduce<Record<string, { deviceName: string; deviceType: string }>>((accumulator, current) => {
          accumulator[current.id] = {
            deviceName: current.deviceName,
            deviceType: current.deviceType
          };

          return accumulator;
        }, {})
      );
    } catch {
      setDevicesError('Unable to load companion devices.');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (!canManagePrimarySecurity) {
      setDevices([]);
      return;
    }

    void loadDevices();
  }, [canManagePrimarySecurity]);

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);

      setTimeout(() => {
        setCopiedIndex(null);
      }, 1500);
    } catch {
      console.error("Copy failed");
    }
  };

  const handleRegenerateSyncKey = async (): Promise<void> => {
    setIsRegenerating(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await api.patch<RegenerateSyncKeyResponse>('/auth/regenerate-sync-key');
      await refreshUser();
      setSuccessMessage(
        response.data.data.syncApiKey
          ? 'Integration key rotated successfully. Reconnect any external clients that still use the previous key.'
          : 'Integration key rotated successfully.'
      );
    } catch {
      setErrorMessage('Unable to regenerate the sync API key.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateCompanionKey = async (): Promise<void> => {
    setIsGeneratingCompanionKey(true);
    setDevicesError(null);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const response = await api.post<CompanionKeyResponse>('/auth/companion-keys', {
        deviceName,
        deviceType
      });
      setGeneratedCompanionKey({
        key: response.data.data.key,
        deviceName: deviceName.trim() || 'Companion device'
      });
      setSuccessMessage('Companion login key generated. It stays valid until it is used.');
      setDeviceName('');
    } catch {
      setDevicesError('Unable to generate a companion device key.');
    } finally {
      setIsGeneratingCompanionKey(false);
    }
  };

  const handleRenameDraftChange = (
    deviceId: string,
    field: 'deviceName' | 'deviceType',
    value: string
  ): void => {
    setRenameDrafts((current) => ({
      ...current,
      [deviceId]: {
        deviceName: current[deviceId]?.deviceName ?? '',
        deviceType: current[deviceId]?.deviceType ?? '',
        [field]: value
      }
    }));
  };

  const handleUpdateDevice = async (deviceId: string): Promise<void> => {
    setActiveDeviceActionId(deviceId);
    setDevicesError(null);

    try {
      const draft = renameDrafts[deviceId];
      await api.patch(`/auth/devices/${deviceId}`, {
        deviceName: draft.deviceName,
        deviceType: draft.deviceType
      });
      await loadDevices();
    } catch {
      setDevicesError('Unable to update the companion device.');
    } finally {
      setActiveDeviceActionId(null);
    }
  };

  const handleRevokeDevice = async (deviceId: string): Promise<void> => {
    const confirmed = window.confirm('Do you want to revoke this companion device?');

    if (!confirmed) {
      return;
    }

    setActiveDeviceActionId(deviceId);
    setDevicesError(null);

    try {
      await api.delete(`/auth/devices/${deviceId}`);
      await loadDevices();
    } catch {
      setDevicesError('Unable to revoke the companion device.');
    } finally {
      setActiveDeviceActionId(null);
    }
  };

  const activeCompanionDevices = devices.filter((device) => device.status === 'active');

  return (
    <main className="stack settings-shell">
      <Navbar />
      <SectionCard className="settings-hero">
        <div className="settings-hero-grid">
          <PageHeader
            title="Settings"
            description="Manage integration security, companion-device access, and external GPT configuration from a tighter control panel."
          />
          <div className="settings-hero-aside">
            <span className="eyebrow">Security Workspace</span>
            <p className="muted-text">
              Companion access, integration credentials, and GPT action setup now live in one restrained admin view. Sensitive
              values are handled through actions instead of being left exposed on the page.
            </p>
          </div>
        </div>
      </SectionCard>
      <div className="settings-grid">
        <SectionCard className="settings-account-card">
          <div className="settings-card-head">
            <div>
              <span className="eyebrow">Account</span>
              <h2>Sync access</h2>
            </div>
            <span className="settings-card-icon"><KeyRound size={18} /></span>
          </div>
          <div className="settings-account-meta">
            <div className="settings-stat">
              <span className="settings-stat-label">Signed in as</span>
              <strong>{user?.email ?? 'Unknown account'}</strong>
            </div>
            <div className="settings-stat">
              <span className="settings-stat-label">Current key status</span>
              <strong>{user?.syncApiKey ? 'Ready to use' : 'Unavailable'}</strong>
            </div>
          </div>
          {canManagePrimarySecurity ? (
            <div className="settings-key-card">
              <div className="settings-key-copy">
                <span className="settings-stat-label">Integration key</span>
                <strong>Hidden by default</strong>
                <p className="muted-text">
                  The sync key is no longer rendered in the interface. Use controlled actions when you need to rotate or copy it.
                </p>
              </div>
              <ActionGroup>
                {user?.syncApiKey ? (
                  <button className="secondary-button settings-copy-button" onClick={() => handleCopy(user.syncApiKey, -1)} type="button">
                    {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
                    {copiedIndex === -1 ? 'Copied' : 'Copy integration key'}
                  </button>
                ) : null}
                <button disabled={isRegenerating} onClick={() => void handleRegenerateSyncKey()} type="button">
                  <RefreshCcw size={14} />
                  {isRegenerating ? 'Rotating key...' : 'Rotate integration key'}
                </button>
              </ActionGroup>
            </div>
          ) : (
            <div className="settings-restricted-card">
              <span className="settings-stat-label">Primary-only control</span>
              <strong>Integration credentials are only available on the main device.</strong>
              <p className="muted-text">
                Companion sessions cannot copy the sync key, rotate credentials, view other companion devices, or authorize new devices.
              </p>
            </div>
          )}
          {isRegenerating ? <p className="muted-text">Requesting a new integration key from the backend...</p> : null}
          {successMessage ? <p className="success-text">{successMessage}</p> : null}
          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        </SectionCard>
        <SectionCard className="settings-summary-card">
          <div className="settings-card-head">
            <div>
              <span className="eyebrow">Access</span>
              <h2>Companion devices</h2>
            </div>
            <span className="settings-card-icon"><Smartphone size={18} /></span>
          </div>
          <div className="settings-account-meta">
            <div className="settings-stat">
              <span className="settings-stat-label">Active devices</span>
              <strong>{activeCompanionDevices.length} / 5</strong>
            </div>
            <div className="settings-stat">
              <span className="settings-stat-label">Policy</span>
              <strong>Primary device approval required</strong>
            </div>
          </div>
          {canManagePrimarySecurity ? (
            <>
              <div className="settings-device-form">
                <div className="field">
                  <label htmlFor="device-name">Device name</label>
                  <input
                    id="device-name"
                    onChange={(event) => setDeviceName(event.target.value)}
                    placeholder="Example: Work iPad"
                    value={deviceName}
                  />
                </div>
                <div className="field">
                  <label htmlFor="device-type">Device type</label>
                  <select id="device-type" onChange={(event) => setDeviceType(event.target.value)} value={deviceType}>
                    <option value="mobile">Mobile</option>
                    <option value="tablet">Tablet</option>
                    <option value="desktop">Desktop</option>
                    <option value="assistant">Assistant</option>
                  </select>
                </div>
                <ActionGroup>
                  <button
                    disabled={isGeneratingCompanionKey || activeCompanionDevices.length >= 5}
                    onClick={() => void handleGenerateCompanionKey()}
                    type="button"
                  >
                    <Shield size={14} />
                    {isGeneratingCompanionKey ? 'Generating key...' : 'Add companion device'}
                  </button>
                </ActionGroup>
              </div>
              <div className="settings-device-list">
                <div className="settings-device-list-head">
                  <strong>Registered companion devices</strong>
                  <button className="secondary-button" onClick={() => void loadDevices()} type="button">
                    Refresh
                  </button>
                </div>
                {isLoadingDevices ? <p className="muted-text">Loading companion devices...</p> : null}
                {devicesError ? <p className="error-text">{devicesError}</p> : null}
                {!isLoadingDevices && devices.length === 0 ? (
                  <div className="settings-empty-state">
                    <p>No companion devices are registered yet.</p>
                  </div>
                ) : null}
                {devices.map((device) => {
                  const draft = renameDrafts[device.id] ?? {
                    deviceName: device.deviceName,
                    deviceType: device.deviceType
                  };
                  const isWorking = activeDeviceActionId === device.id;

                  return (
                    <article className="settings-device-row" key={device.id}>
                      <div className="settings-device-row-top">
                        <div>
                          <strong>{device.deviceName}</strong>
                          <p className="muted-text">{device.deviceType}</p>
                        </div>
                        <span className={`settings-device-status settings-device-status-${device.status}`}>
                          {device.status === 'active' ? 'Active' : 'Revoked'}
                        </span>
                      </div>
                      <div className="settings-device-edit-grid">
                        <input
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
                          disabled={isWorking || device.status !== 'active'}
                          onClick={() => void handleUpdateDevice(device.id)}
                          type="button"
                        >
                          {isWorking ? 'Saving...' : 'Update device'}
                        </button>
                        <button
                          className="danger-button"
                          disabled={isWorking || device.status !== 'active'}
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
              <strong>Only the main device can add, view, update, or revoke companion devices.</strong>
              <p className="muted-text">
                This session can use the app normally, but companion-device administration is intentionally hidden and blocked.
              </p>
            </div>
          )}
        </SectionCard>
      </div>
      <SectionCard className="settings-summary-card">
        <div className="settings-card-head">
          <div>
            <span className="eyebrow">Checklist</span>
            <h2>Before connecting GPT</h2>
          </div>
          <span className="settings-card-icon"><ListChecks size={18} /></span>
        </div>
        <ul className="settings-checklist">
          <li>Use the integration key only in trusted tools and private automations.</li>
          <li>Paste the schema exactly as provided in the guide below.</li>
          <li>Keep the instruction block intact so task, project, and note operations stay consistent.</li>
          <li>Rotate the integration key immediately if it has been exposed or copied into an untrusted environment.</li>
        </ul>
      </SectionCard>
      <SectionCard className="settings-integration-card">
        <div className="settings-card-head">
          <div>
            <span className="eyebrow">Guide</span>
            <h2>ChatGPT integration</h2>
            <p className="muted-text">Follow these steps in order to configure a custom GPT against your Todo Sync backend.</p>
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
                          <li key={detail} style={{ whiteSpace: 'pre-line' }}>
                            {detail}
                          </li>
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
      {generatedCompanionKey ? (
        <Modal onClose={() => setGeneratedCompanionKey(null)} panelClassName="settings-secret-modal" title="Companion Device Key">
          <div className="settings-secret-modal-body">
            <p className="muted-text">
              This key is shown once for <strong>{generatedCompanionKey.deviceName}</strong>. Share it directly with the target device and do
              not leave it visible in screenshots or recordings.
            </p>
            <code className="settings-secret-value">{generatedCompanionKey.key}</code>
            <p className="muted-text">This key does not expire on its own. It becomes unusable after the first successful companion login.</p>
            <ActionGroup>
              <button onClick={() => void handleCopy(generatedCompanionKey.key, -2)} type="button">
                {copiedIndex === -2 ? <Check size={14} /> : <Copy size={14} />}
                {copiedIndex === -2 ? 'Copied' : 'Copy device key'}
              </button>
              <button className="secondary-button" onClick={() => setGeneratedCompanionKey(null)} type="button">
                Close
              </button>
            </ActionGroup>
          </div>
        </Modal>
      ) : null}
    </main>
  );
}

export default SettingsPage;
