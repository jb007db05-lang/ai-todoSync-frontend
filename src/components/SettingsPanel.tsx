import { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  RefreshCcw,
  Shield,
  Smartphone,
  Sparkles,
  Settings2
} from 'lucide-react';

import ManageDevicesModal from '@/components/ManageDevicesModal';
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
  status: 'active' | 'revoked' | 'pending';
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

PROJECT WORKFLOW:
- If the user wants to list or check projects:
  → call fetchProjects
  → return project names and IDs

- If the user wants to create a new project:
  → call createProject
  → extract a clean project name
  → confirm successful creation with the project ID

- If the user wants to update an existing project:
  → call updateProject with the project ID
  → include any new name or details provided

- If the user wants to delete a project:
  → call deleteProject with the project ID
  → confirm the deletion

- If the user wants to delete multiple projects at once:
  → call bulkDeleteProjects with an array of project IDs
  → confirm how many projects were deleted

EPIC WORKFLOW:
- If the user wants to list or check epics for a project:
  → call fetchProjectEpics with the project ID
  → return epic names, IDs, statuses, and order

- If the user wants to create a new epic:
  → call createEpic with project ID, name, and optional description
  → confirm successful creation with the epic ID

- If the user wants to update an epic:
  → call updateEpic with project ID and epic ID
  → update name, description, or status as requested

- If the user wants to delete an epic:
  → call deleteEpic with project ID and epic ID
  → confirm the deletion

- If the user wants to reorder epics:
  → call reorderEpics with project ID and the new order of epic IDs
  → confirm the reorder was successful

TASK WORKFLOW:
- If the user wants to add one task, create one reminder, or save one action item:
  → call syncSingleTask
  → extract a clean, short, actionable task title
  → include date when the user provides one (YYYY-MM-DD format)
  → include project when the user specifies one (by ID or name)
  → include epic when the user specifies one and project is known
  → include a task note when the user provides extra task-specific context
  → include subtasks when the user specifies them
  → include subtask notes when the user provides extra subtask-specific context
  → include status when specified (pending, in_progress, in_review, completed, rolled_over, done)

- If the user provides multiple tasks in one request:
  → call syncTasks
  → split them into clear individual tasks
  → preserve any provided dates, projects, epics, statuses, notes, and subtasks
  → maximum 100 tasks per sync call

- If the user asks to list, show, fetch, review, or check tasks:
  → call fetchTasks
  → include date when the user asks for a specific day (YYYY-MM-DD format)
  → return all tasks with their details including subtasks

- If the user wants a task assigned to an epic:
  → ensure the project is known
  → fetch epics for that project if epic ID is not already known
  → use the returned epic ID when syncing the task
  → never invent epic IDs
  → never send an epic without a matching project

SUBTASK WORKFLOW:
- Subtasks are created as part of task creation/sync operations
- When creating tasks with subtasks, include the subtasks array with each subtask having:
  → title (required)
  → note (optional)
  → status (optional: pending, in_progress, in_review, completed, done)
  → completed (optional boolean)
  → completedAt (optional ISO datetime string)

NOTE WORKFLOW:
- If the user asks to list, review, or fetch notes for a project:
  → call fetchProjectNotes

- If the user asks to create a note for a project:
  → call createProjectNote
  → requires title and content

- If the user asks to open a single note:
  → call fetchNote with the note ID

- If the user asks to edit or update an existing note:
  → call updateNote with the note ID
  → provide new title and/or content

- If the user asks to append more content to an existing note:
  → call updateNote
  → send appendContent: true so the new content is added without replacing the existing note

- If the user asks to delete a note:
  → call deleteNote with the note ID

SUMMARY AND ANALYTICS:
- If the user asks for progress, counts, status breakdown, or daily overview:
  → call fetchTaskSummary
  → include date when the user asks for a specific day (YYYY-MM-DD format)
  → returns total, pending, inProgress, inReview, completed, and rolledOver counts

AUTHENTICATION:
- All API calls require authentication via the x-sync-api-key header
- The sync API key can be obtained from Todo Sync settings
- The same sync key works for all operations: sync routes, projects, epics, and notes

RULES:
- Always use the Todo Sync API for both creation and fetching
- Behave consistently in both the portal and the integrated AI app
- Keep task titles concise, meaningful, and action-oriented
- Remove filler words and preserve only the actionable intent
- Use only the available actions defined in the schema
- If a request contains a date, include it in the API call when relevant (format: YYYY-MM-DD)
- If a project is specified by name, fetch projects first to find the matching ID
- If an epic is specified by name, fetch epics for the project first to find the matching ID
- If the request is slightly ambiguous, infer the most reasonable action without unnecessary back-and-forth
- Always validate project IDs exist before attempting to use them for epics or tasks
- Subtasks cannot exist independently - they must be attached to a task
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
      summary: Fetch tasks for a user
      description: Retrieve all tasks for the authenticated user, optionally filtered by date
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: date
          required: false
          description: Filter tasks by date (YYYY-MM-DD format)
          schema:
            type: string
            pattern: '^\d{4}-\d{2}-\d{2}$'
      responses:
        "200":
          description: Task list fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchTasksResponse'
        "401":
          description: Authentication required
        "500":
          description: Server error

  /api/projects:
    get:
      operationId: fetchProjects
      summary: Fetch all projects
      description: Retrieve all projects belonging to the authenticated user
      security:
        - SyncApiKey: []
      responses:
        "200":
          description: Project list fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchProjectsResponse'
        "401":
          description: Authentication required
    post:
      operationId: createProject
      summary: Create a new project
      description: Create a new project with the given name
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateProjectRequest'
      responses:
        "201":
          description: Project created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectResponse'
        "400":
          description: Invalid input - project name is required
        "401":
          description: Authentication required

  /api/projects/{projectId}:
    patch:
      operationId: updateProject
      summary: Update a project
      description: Update an existing project's name or details
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project to update
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateProjectRequest'
      responses:
        "200":
          description: Project updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProjectResponse'
        "401":
          description: Authentication required
        "404":
          description: Project not found
    delete:
      operationId: deleteProject
      summary: Delete a project
      description: Delete a project by its ID
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project to delete
          schema:
            type: string
      responses:
        "200":
          description: Project deleted successfully
        "401":
          description: Authentication required
        "404":
          description: Project not found

  /api/projects/bulk-delete:
    post:
      operationId: bulkDeleteProjects
      summary: Delete multiple projects
      description: Delete multiple projects at once by their IDs
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BulkDeleteProjectsRequest'
      responses:
        "200":
          description: Projects deleted successfully
        "400":
          description: Invalid input - projectIds array required
        "401":
          description: Authentication required

  /api/projects/{projectId}/epics:
    get:
      operationId: fetchProjectEpics
      summary: Fetch epics for a project
      description: Retrieve all epics belonging to a specific project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project to fetch epics for
          schema:
            type: string
      responses:
        "200":
          description: Epic list fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchEpicsResponse'
        "401":
          description: Authentication required
        "404":
          description: Project not found
    post:
      operationId: createEpic
      summary: Create a new epic
      description: Create a new epic within a project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project to create the epic in
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateEpicRequest'
      responses:
        "201":
          description: Epic created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EpicResponse'
        "400":
          description: Invalid input - epic name is required
        "401":
          description: Authentication required
        "404":
          description: Project not found

  /api/projects/{projectId}/epics/{epicId}:
    patch:
      operationId: updateEpic
      summary: Update an epic
      description: Update an existing epic's details
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project containing the epic
          schema:
            type: string
        - in: path
          name: epicId
          required: true
          description: ID of the epic to update
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateEpicRequest'
      responses:
        "200":
          description: Epic updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EpicResponse'
        "401":
          description: Authentication required
        "404":
          description: Project or epic not found
    delete:
      operationId: deleteEpic
      summary: Delete an epic
      description: Delete an epic by its ID
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project containing the epic
          schema:
            type: string
        - in: path
          name: epicId
          required: true
          description: ID of the epic to delete
          schema:
            type: string
      responses:
        "200":
          description: Epic deleted successfully
        "401":
          description: Authentication required
        "404":
          description: Project or epic not found

  /api/projects/{projectId}/epics/reorder:
    patch:
      operationId: reorderEpics
      summary: Reorder epics
      description: Reorder epics within a project by providing a sorted list of epic IDs
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project containing the epics
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReorderEpicsRequest'
      responses:
        "200":
          description: Epics reordered successfully
        "400":
          description: Invalid input - epicIds array required
        "401":
          description: Authentication required
        "404":
          description: Project not found

  /api/projects/{projectId}/notes:
    get:
      operationId: fetchProjectNotes
      summary: Fetch notes for a project
      description: Retrieve all notes belonging to a specific project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project to fetch notes for
          schema:
            type: string
      responses:
        "200":
          description: Project notes fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchProjectNotesResponse'
        "401":
          description: Authentication required
        "404":
          description: Project not found
    post:
      operationId: createProjectNote
      summary: Create a note for a project
      description: Create a new note within a project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: projectId
          required: true
          description: ID of the project to create the note in
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
          description: Note created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NoteResponse'
        "400":
          description: Invalid input - title and content required
        "401":
          description: Authentication required

  /api/notes/{id}:
    get:
      operationId: fetchNote
      summary: Fetch a single note
      description: Retrieve a specific note by its ID
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          description: ID of the note to fetch
          schema:
            type: string
      responses:
        "200":
          description: Note fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NoteResponse'
        "401":
          description: Authentication required
        "404":
          description: Note not found
    put:
      operationId: updateNote
      summary: Update or append to a note
      description: Update a note's content or append to it
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          description: ID of the note to update
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
          description: Note updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NoteResponse'
        "400":
          description: Invalid input
        "401":
          description: Authentication required
        "404":
          description: Note not found
    delete:
      operationId: deleteNote
      summary: Delete a note
      description: Delete a note by its ID
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          description: ID of the note to delete
          schema:
            type: string
      responses:
        "200":
          description: Note deleted successfully
        "401":
          description: Authentication required
        "404":
          description: Note not found

  /api/sync/summary:
    get:
      operationId: fetchTaskSummary
      summary: Fetch task summary
      description: Get a summary of task counts by status for a specific date
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: date
          required: false
          description: Date to get summary for (YYYY-MM-DD format)
          schema:
            type: string
            pattern: '^\d{4}-\d{2}-\d{2}$'
      responses:
        "200":
          description: Task summary fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/FetchSummaryResponse'
        "401":
          description: Authentication required

  /api/sync/single:
    post:
      operationId: syncSingleTask
      summary: Create a single task
      description: Create a single task with optional project, epic, subtasks, and notes
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
        "400":
          description: Invalid input - task title is required
        "401":
          description: Authentication required

  /api/sync:
    post:
      operationId: syncTasks
      summary: Create multiple tasks
      description: Create multiple tasks in a single request (max 100)
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
        "400":
          description: Invalid input
        "413":
          description: Too many tasks (max 100 per request)
        "401":
          description: Authentication required

components:
  securitySchemes:
    SyncApiKey:
      type: apiKey
      in: header
      name: x-sync-api-key
      description: API key for sync operations. Get this from your Todo Sync settings.

  schemas:
    # Task Related Schemas
    SyncSingleTaskRequest:
      type: object
      additionalProperties: false
      required: [title]
      properties:
        title:
          type: string
          description: Task title (required)
        description:
          type: string
          description: Optional task description
        note:
          type: string
          description: Optional task note
        status:
          $ref: '#/components/schemas/TaskStatus'
        source:
          type: string
          description: Source identifier for the task
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
          description: Task date in YYYY-MM-DD format
        project:
          $ref: '#/components/schemas/SyncProjectInput'
        epic:
          type: string
          description: Epic ID to assign the task to (requires project)
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
          description: Default date for all tasks (YYYY-MM-DD format)
        source:
          type: string
          description: Default source for all tasks

    SyncTaskInput:
      type: object
      additionalProperties: false
      required: [title]
      properties:
        title:
          type: string
          description: Task title (required)
        description:
          type: string
          description: Optional task description
        note:
          type: string
          description: Optional task note
        status:
          $ref: '#/components/schemas/TaskStatus'
        source:
          type: string
          description: Source identifier for the task
        project:
          $ref: '#/components/schemas/SyncProjectInput'
        epic:
          type: string
          description: Epic ID to assign the task to (requires project)
        subtasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncSubtaskInput'

    SyncSubtaskInput:
      type: object
      additionalProperties: false
      required: [title]
      properties:
        title:
          type: string
          description: Subtask title (required)
        note:
          type: string
          description: Optional subtask note
        status:
          $ref: '#/components/schemas/SubtaskStatus'
        completed:
          type: boolean
          description: Whether the subtask is completed
        completedAt:
          type: string
          format: date-time
          description: ISO 8601 datetime when subtask was completed

    TaskStatus:
      type: string
      enum: [pending, in_progress, in_review, completed, rolled_over, done]
      description: Task workflow status

    SubtaskStatus:
      type: string
      enum: [pending, in_progress, in_review, completed, done]
      description: Subtask workflow status

    # Project Related Schemas
    SyncProjectInput:
      oneOf:
        - type: string
          description: Project ID or name as a string
        - type: object
          additionalProperties: false
          required: [name]
          properties:
            name:
              type: string
              description: Project name to use or create

    CreateProjectRequest:
      type: object
      additionalProperties: false
      required: [name]
      properties:
        name:
          type: string
          description: Project name (required)

    UpdateProjectRequest:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
          description: New project name

    BulkDeleteProjectsRequest:
      type: object
      additionalProperties: false
      required: [projectIds]
      properties:
        projectIds:
          type: array
          items:
            type: string
          description: Array of project IDs to delete

    ProjectResponseItem:
      type: object
      additionalProperties: false
      required: [id, name, userId]
      properties:
        id:
          type: string
          description: Project unique identifier
        name:
          type: string
          description: Project name
        userId:
          type: string
          description: ID of the user who owns the project

    ProjectResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [project]
          properties:
            project:
              $ref: '#/components/schemas/ProjectResponseItem'

    # Epic Related Schemas
    CreateEpicRequest:
      type: object
      additionalProperties: false
      required: [name]
      properties:
        name:
          type: string
          description: Epic name (required)
        description:
          type: string
          description: Optional epic description
        status:
          $ref: '#/components/schemas/EpicStatus'

    UpdateEpicRequest:
      type: object
      additionalProperties: false
      properties:
        name:
          type: string
          description: New epic name
        description:
          type: string
          description: New epic description
        status:
          $ref: '#/components/schemas/EpicStatus'
        order:
          type: integer
          description: New position in the epic list

    ReorderEpicsRequest:
      type: object
      additionalProperties: false
      required: [epicIds]
      properties:
        epicIds:
          type: array
          items:
            type: string
          description: Ordered array of epic IDs

    EpicStatus:
      type: string
      enum: [planned, active, completed, archived]
      description: Epic lifecycle status

    EpicResponseItem:
      type: object
      additionalProperties: false
      required: [id, name, projectId, status, order]
      properties:
        id:
          type: string
          description: Epic unique identifier
        name:
          type: string
          description: Epic name
        description:
          type: string
          description: Epic description
        projectId:
          type: string
          description: ID of the project containing this epic
        status:
          type: string
          enum: [planned, active, completed, archived]
          description: Epic status
        order:
          type: integer
          description: Position in the epic list

    EpicResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [epic]
          properties:
            epic:
              $ref: '#/components/schemas/EpicResponseItem'

    # Note Related Schemas
    CreateProjectNoteRequest:
      type: object
      additionalProperties: false
      required: [title, content]
      properties:
        title:
          type: string
          description: Note title (required)
        content:
          type: string
          description: Note content (required)

    UpdateNoteRequest:
      type: object
      additionalProperties: false
      required: [content]
      properties:
        title:
          type: string
          description: New note title (optional)
        content:
          type: string
          description: New note content (required)
        appendContent:
          type: boolean
          description: If true, append content instead of replacing

    NoteItem:
      type: object
      additionalProperties: false
      required: [id, projectId, title, content]
      properties:
        id:
          type: string
          description: Note unique identifier
        projectId:
          type: string
          description: ID of the project containing this note
        title:
          type: string
          description: Note title
        content:
          type: string
          description: Note content

    NoteResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [note]
          properties:
            note:
              $ref: '#/components/schemas/NoteItem'

    # Response Schemas
    SyncSubtaskResponse:
      type: object
      additionalProperties: false
      required: [id, title, status, completed, completedAt]
      properties:
        id:
          type: string
          description: Subtask unique identifier
        title:
          type: string
          description: Subtask title
        note:
          type: string
          description: Subtask note
        status:
          type: string
          enum: [pending, in_progress, in_review, completed]
          description: Subtask status
        completed:
          type: boolean
          description: Whether the subtask is completed
        completedAt:
          type: string
          format: date-time
          nullable: true
          description: Completion timestamp

    SyncTaskResponseItem:
      type: object
      additionalProperties: false
      required: [id, title, date, status, projectId, epicId, subtasks]
      properties:
        id:
          type: string
          description: Task unique identifier
        title:
          type: string
          description: Task title
        description:
          type: string
          description: Task description
        note:
          type: string
          description: Task note
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
          description: Task date (YYYY-MM-DD)
        status:
          type: string
          enum: [pending, in_progress, in_review, completed, rolled_over]
          description: Task status
        source:
          type: string
          description: Source identifier
        projectId:
          type: string
          nullable: true
          description: ID of the project this task belongs to
        epicId:
          type: string
          nullable: true
          description: ID of the epic this task belongs to
        subtasks:
          type: array
          items:
            $ref: '#/components/schemas/SyncSubtaskResponse'

    SyncSingleTaskResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [task]
          properties:
            task:
              $ref: '#/components/schemas/SyncTaskResponseItem'

    SyncTasksResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [tasks, date, synced]
          properties:
            date:
              type: string
              pattern: '^\d{4}-\d{2}-\d{2}$'
              description: Task date (YYYY-MM-DD)
            synced:
              type: integer
              description: Number of tasks synced
            tasks:
              type: array
              items:
                $ref: '#/components/schemas/SyncTaskResponseItem'

    FetchTasksResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [tasks, date]
          properties:
            date:
              type: string
              pattern: '^\d{4}-\d{2}-\d{2}$'
              description: Task date (YYYY-MM-DD)
            tasks:
              type: array
              items:
                $ref: '#/components/schemas/SyncTaskResponseItem'

    FetchProjectsResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [projects]
          properties:
            projects:
              type: array
              items:
                $ref: '#/components/schemas/ProjectResponseItem'

    FetchEpicsResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [epics]
          properties:
            epics:
              type: array
              items:
                $ref: '#/components/schemas/EpicResponseItem'

    FetchProjectNotesResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [notes]
          properties:
            notes:
              type: array
              items:
                $ref: '#/components/schemas/NoteItem'

    TaskSummaryResponseItem:
      type: object
      additionalProperties: false
      required: [total, pending, inProgress, inReview, completed, rolledOver]
      properties:
        total:
          type: integer
          description: Total number of tasks
        pending:
          type: integer
          description: Number of pending tasks
        inProgress:
          type: integer
          description: Number of tasks in progress
        inReview:
          type: integer
          description: Number of tasks in review
        completed:
          type: integer
          description: Number of completed tasks
        rolledOver:
          type: integer
          description: Number of rolled over tasks
        date:
          type: string
          pattern: '^\d{4}-\d{2}-\d{2}$'
          description: Summary date (YYYY-MM-DD)

    FetchSummaryResponse:
      type: object
      additionalProperties: false
      required: [message, data]
      properties:
        message:
          type: string
        data:
          type: object
          required: [summary, date]
          properties:
            date:
              type: string
              pattern: '^\d{4}-\d{2}-\d{2}$'
              description: Summary date (YYYY-MM-DD)
            summary:
              $ref: '#/components/schemas/TaskSummaryResponseItem'`;

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
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isGeneratingCompanionKey, setIsGeneratingCompanionKey] = useState<boolean>(false);
  const [deviceName, setDeviceName] = useState<string>('');
  const [deviceType, setDeviceType] = useState<string>('mobile');
  const [generatedCompanionKey, setGeneratedCompanionKey] = useState<{
    key: string;
    deviceName: string;
  } | null>(null);
  const canManagePrimarySecurity = session?.deviceType === 'primary';

  const loadDevices = async (): Promise<void> => {
    try {
      const response = await api.get<CompanionDevicesResponse>('/auth/devices');
      console.log('[SettingsPanel] Raw API Response:', JSON.stringify(response.data, null, 2));
      const fetched = response.data.data?.devices ?? [];
      console.log('[SettingsPanel] Extracted Devices Array:', fetched);
      setDevices(fetched);
    } catch (err) {
      console.error('[SettingsPanel] Error loading devices:', err);
    }
  };

  useEffect(() => {
    console.log('[SettingsPanel] Current Devices State:', devices);
  }, [devices]);

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
      const response = await api.patch<RegenerateSyncKeyResponse>('/auth/regenerate-sync-key');
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
      const response = await api.post<CompanionKeyResponse>('/auth/companion-keys', {
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

  const handleCopy = async (text: string, index: number): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {
      alert('Unable to copy to clipboard.');
    }
  };

  const ghostBtn = 'inline-flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded text-zinc-600 dark:text-slate-300 text-sm hover:bg-zinc-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors';
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
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-zinc-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 shadow-sm text-zinc-400 dark:text-slate-500 border border-zinc-100 dark:border-slate-700">
                      <Smartphone size={18} />
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest m-0 mb-0.5">Device Registry</p>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-slate-100 m-0">
                        {devices.length} registered {devices.length === 1 ? 'device' : 'devices'}
                      </p>
                    </div>
                  </div>
                  <button
                    className={ghostBtn}
                    onClick={() => setIsManageModalOpen(true)}
                    type="button"
                  >
                    <Settings2 size={14} />
                    Manage devices
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-100 dark:border-slate-800/50">
                  <p className="text-[0.65rem] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest mb-2">New Device Key</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="bg-white/50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-slate-100 transition-all focus:outline-none focus:border-blue-500"
                      onChange={(event) => setDeviceName(event.target.value)}
                      placeholder="e.g. Work Mobile"
                      value={deviceName}
                    />
                    <select
                      className="bg-white/50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-zinc-900 dark:text-slate-100 transition-all focus:outline-none focus:border-blue-500"
                      onChange={(event) => setDeviceType(event.target.value)}
                      value={deviceType}
                    >
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                      <option value="desktop">Desktop</option>
                      </select>
                  </div>
                  <button
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    disabled={isGeneratingCompanionKey || !deviceName.trim() || devices.length >= 5}
                    onClick={() => void handleGenerateCompanionKey()}
                    type="button"
                  >
                    <Shield size={16} />
                    {isGeneratingCompanionKey ? 'Generating...' : 'Generate Device Key'}
                  </button>
                </div>
              </div>

              {isManageModalOpen && (
                <ManageDevicesModal
                  onClose={() => setIsManageModalOpen(false)}
                  onDevicesChanged={() => {
                    void loadDevices();
                  }}
                />
              )}
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
              Key for <strong className="text-zinc-800 dark:text-slate-200">{generatedCompanionKey?.deviceName}</strong>. Copy it now; it won't be shown again.
            </p>
            <code className="block bg-zinc-900 dark:bg-[#0d1117] text-zinc-100 text-[0.85rem] rounded-xl p-4 break-all">
              {generatedCompanionKey?.key}
            </code>
            <div className="flex gap-3">
              <button className={primaryBtn} onClick={() => generatedCompanionKey?.key && void handleCopy(generatedCompanionKey.key, -2)} type="button">
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
