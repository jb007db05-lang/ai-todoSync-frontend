import { useState } from 'react';
import { Copy, Check } from "lucide-react";

import ActionGroup from '@/components/ActionGroup';
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
  → include subtasks when the user specifies them

- If the user provides multiple tasks in one request:
  → call syncTasks
  → split them into clear individual tasks
  → preserve any provided dates, projects, statuses, and subtasks

- If the user asks to list, show, fetch, review, or check tasks:
  → call fetchTasks
  → include date when the user asks for a specific day

- If the user asks to list or check projects:
  → call fetchProjects

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
- Use only these available actions: syncSingleTask, syncTasks, fetchTasks, fetchProjects, fetchTaskSummary
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
      "Keep Authentication as 'None' for now (or configure later if needed).",
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
      responses:
        "200":
          description: Project list fetched
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchProjectsResponse'

  /api/sync/summary:
    get:
      operationId: fetchTaskSummary
      summary: Fetch task summary
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
  schemas:
    SyncSingleTaskRequest:
      type: object
      additionalProperties: false
      required:
        - title
      properties:
        title:
          type: string
          description: Short task title
        description:
          type: string
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
          items:
            $ref: '#/components/schemas/SyncSubtaskInput'

    SyncTasksRequest:
      type: object
      additionalProperties: false
      required:
        - tasks
      properties:
        tasks:
          type: array
          minItems: 1
          items:
            $ref: '#/components/schemas/SyncTaskInput'
        date:
          type: string
          format: date
          description: YYYY-MM-DD
        source:
          type: string

    SyncTaskInput:
      type: object
      additionalProperties: false
      required:
        - title
      properties:
        title:
          type: string
          description: Task title
        description:
          type: string
        status:
          $ref: '#/components/schemas/TaskStatus'
        source:
          type: string
        project:
          $ref: '#/components/schemas/SyncProjectInput'
        subtasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncSubtaskInput'

    SyncProjectInput:
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
      properties:
        title:
          type: string
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
  const { refreshUser, user } = useAuth();
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openStepIndex, setOpenStepIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
      setSuccessMessage(`New sync key issued: ${response.data.data.syncApiKey}`);
    } catch {
      setErrorMessage('Unable to regenerate the sync API key.');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <main className="stack">
      <Navbar />
      <SectionCard>
        <PageHeader title="Settings" description="Manage the authenticated session and review integration details." />
      </SectionCard>
      <SectionCard>
        <h2>Account</h2>
        <p>{user?.email}</p>
        <div className="sync-key-container">

          {user?.syncApiKey && (
            <button
              className="copy-button"
              onClick={() => handleCopy(user.syncApiKey, -1)}
              type="button"
              style={{ display: "flex", alignItems: "center", gap: "4px", background: "#0d1117" }}
            >
              Copy Sync Key {copiedIndex === -1 ? <Check size={14} /> : <Copy size={14} />}
            </button>
          )}
        </div>
        <ActionGroup>
          <button disabled={isRegenerating} onClick={() => void handleRegenerateSyncKey()} type="button">
            {isRegenerating ? 'Regenerating key...' : 'Regenerate sync key'}
          </button>
        </ActionGroup>
        {isRegenerating ? <p className="muted-text">Requesting a new sync key from the backend...</p> : null}
        {successMessage ? <p className="success-text">{successMessage}</p> : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </SectionCard>
      <SectionCard>
        <h2>Chat GPT Integration</h2>
        <div className="accordion-list">
          {chatGptIntegrationSteps.map((step, index) => {
            const isOpen = openStepIndex === index;
            const panelId = `chatgpt-step-panel-${index}`;

            return (
              <article className={`accordion-item${isOpen ? ' accordion-item-open' : ''}`} key={step.title}>
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
                          <li key={detail} style={{ whiteSpace: "pre-line" }}>
                            {detail}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {step.code && (
                      <div className="code-container">
                        <button
                          className="copy-button"
                          onClick={() => handleCopy(step.code!, index)}
                          type="button"
                        >
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
    </main>
  );
}

export default SettingsPage;
