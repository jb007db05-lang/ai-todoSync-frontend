export const SYNC_CHATGPT_INSTRUCTION_TEXT = String.raw`
You are a task assistant connected to Todo Sync API.

Use Todo Sync API for all project, epic, task, and note operations.

HIERARCHY:
- Project -> Epic -> Task -> Subtask
- Notes are polymorphic and can belong to: project, epic, task, or subtask
- Never invent IDs. Reuse IDs returned by API.

CORE RULES:
- Use \`x-sync-api-key\` authentication on every call
- Keep titles short and actionable
- Validate parent-child relationships before creating nested records
- For notes, always send both \`parentType\` and \`parentId\`
- For list endpoints, respect pagination fields: \`page\`, \`limit\`
- If user names a project or epic instead of giving an ID, list first, then use returned ID

PROJECT WORKFLOW:
- List projects: \`GET /api/sync/projects\`
- Create project: \`POST /api/sync/projects\`
- Get one project: \`GET /api/sync/projects/{id}\`
- Update project: \`PUT /api/sync/projects/{id}\`
- Delete project: \`DELETE /api/sync/projects/{id}\`

EPIC WORKFLOW:
- List epics: \`GET /api/sync/epics\` and include \`projectId\` when filtering to one project
- Create epic: \`POST /api/sync/epics\` with \`projectId\`
- Get one epic: \`GET /api/sync/epics/{id}\`
- Update epic: \`PUT /api/sync/epics/{id}\`
- Delete epic: \`DELETE /api/sync/epics/{id}\`

TASK WORKFLOW:
- List tasks: \`GET /api/sync/tasks\`
- Create one task: \`POST /api/sync/tasks\`
- Get one task: \`GET /api/sync/tasks/{id}\`
- Update task: \`PUT /api/sync/tasks/{id}\`
- Delete task: \`DELETE /api/sync/tasks/{id}\`
- Bulk sync tasks only when user clearly provides multiple tasks: \`POST /api/sync\`
- Legacy single sync helper is allowed: \`POST /api/sync/single\`

NOTE WORKFLOW:
- List notes: \`GET /api/sync/notes\`
- Create note: \`POST /api/sync/notes\`
- Get note: \`GET /api/sync/notes/{id}\`
- Update note: \`PUT /api/sync/notes/{id}\`
- Delete note: \`DELETE /api/sync/notes/{id}\`
- For notes, send:
  - \`title\`
  - \`content\`
  - \`parentType\`: one of \`project\`, \`epic\`, \`task\`, \`subtask\`
  - \`parentId\`
  - Optional \`appendContent: true\` when adding content to existing note

SUMMARY WORKFLOW:
- For progress or daily overview, call \`GET /api/sync/summary\`

STATUS RULES:
- Task statuses: \`BACKLOG\`, \`TODO\`, \`IN_PROGRESS\`, \`IN_REVIEW\`, \`BLOCKED\`, \`DONE\`, \`rolled_over\`
- Epic statuses: \`planned\`, \`active\`, \`completed\`, \`archived\`

LIST RESPONSE SHAPE:
- CRUD list endpoints return:
  - \`data\`: array
  - \`total\`: number
  - \`page\`: number
  - \`limit\`: number

ERROR HANDLING:
- Errors come back as:
  - \`success: false\`
  - \`message: string\`
  - \`code: string\`
`;

export const SYNC_CHATGPT_ACTION_SCHEMA = String.raw`openapi: 3.1.0
info:
  title: Todo Sync API
  version: 2.0.0
servers:
  - url: https://ai-todosync-backend.onrender.com
paths:
  /api/sync/projects:
    get:
      operationId: listProjects
      summary: List projects
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: page
          schema: { type: integer, minimum: 1 }
        - in: query
          name: limit
          schema: { type: integer, minimum: 1, maximum: 100 }
      responses:
        '200':
          description: Paginated project list
    post:
      operationId: createProject
      summary: Create project
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name]
              properties:
                name: { type: string }
                description: { type: string }
      responses:
        '201': { description: Project created }
  /api/sync/projects/{id}:
    get:
      operationId: getProject
      summary: Get project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200': { description: Project fetched }
    put:
      operationId: updateProject
      summary: Update project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                description: { type: string }
      responses:
        '200': { description: Project updated }
    delete:
      operationId: deleteProject
      summary: Delete project
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200': { description: Project deleted }
  /api/sync/epics:
    get:
      operationId: listEpics
      summary: List epics
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: page
          schema: { type: integer, minimum: 1 }
        - in: query
          name: limit
          schema: { type: integer, minimum: 1, maximum: 100 }
        - in: query
          name: projectId
          schema: { type: string }
      responses:
        '200': { description: Paginated epic list }
    post:
      operationId: createEpic
      summary: Create epic
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [projectId, name]
              properties:
                projectId: { type: string }
                name: { type: string }
                description: { type: string }
                status:
                  type: string
                  enum: [planned, active, completed, archived]
      responses:
        '201': { description: Epic created }
  /api/sync/epics/{id}:
    get:
      operationId: getEpic
      summary: Get epic
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200': { description: Epic fetched }
    put:
      operationId: updateEpic
      summary: Update epic
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                description: { type: string }
                status:
                  type: string
                  enum: [planned, active, completed, archived]
      responses:
        '200': { description: Epic updated }
    delete:
      operationId: deleteEpic
      summary: Delete epic
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200': { description: Epic deleted }
  /api/sync/tasks:
    get:
      operationId: listTasks
      summary: List tasks
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: page
          schema: { type: integer, minimum: 1 }
        - in: query
          name: limit
          schema: { type: integer, minimum: 1, maximum: 100 }
        - in: query
          name: date
          schema: { type: string, pattern: '^\d{4}-\d{2}-\d{2}$' }
        - in: query
          name: projectId
          schema: { type: string }
        - in: query
          name: epicId
          schema: { type: string }
      responses:
        '200': { description: Paginated task list }
    post:
      operationId: createTask
      summary: Create task
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title, date]
              properties:
                title: { type: string }
                description: { type: string }
                note: { type: string }
                date: { type: string, pattern: '^\d{4}-\d{2}-\d{2}$' }
                status:
                  type: string
                  enum: [BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE, rolled_over]
                priority:
                  type: string
                  enum: [LOW, MEDIUM, HIGH]
                source: { type: string }
                projectId: { type: string, nullable: true }
                epicId: { type: string, nullable: true }
      responses:
        '201': { description: Task created }
  /api/sync/tasks/{id}:
    get:
      operationId: getTask
      summary: Get task
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200': { description: Task fetched }
    put:
      operationId: updateTask
      summary: Update task
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title: { type: string }
                description: { type: string }
                note: { type: string }
                date: { type: string, pattern: '^\d{4}-\d{2}-\d{2}$' }
                status:
                  type: string
                  enum: [BACKLOG, TODO, IN_PROGRESS, IN_REVIEW, BLOCKED, DONE, rolled_over]
                priority:
                  type: string
                  enum: [LOW, MEDIUM, HIGH]
                projectId: { type: string, nullable: true }
                epicId: { type: string, nullable: true }
      responses:
        '200': { description: Task updated }
    delete:
      operationId: deleteTask
      summary: Delete task
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200': { description: Task deleted }
  /api/sync/notes:
    get:
      operationId: listNotes
      summary: List notes
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: page
          schema: { type: integer, minimum: 1 }
        - in: query
          name: limit
          schema: { type: integer, minimum: 1, maximum: 100 }
        - in: query
          name: projectId
          schema: { type: string }
        - in: query
          name: parentType
          schema:
            type: string
            enum: [project, epic, task, subtask]
        - in: query
          name: parentId
          schema: { type: string }
      responses:
        '200': { description: Paginated note list }
    post:
      operationId: createNote
      summary: Create note
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title, parentType, parentId]
              properties:
                title: { type: string }
                content: { type: string }
                parentType:
                  type: string
                  enum: [project, epic, task, subtask]
                parentId: { type: string }
      responses:
        '201': { description: Note created }
  /api/sync/notes/{id}:
    get:
      operationId: getNote
      summary: Get note
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200': { description: Note fetched }
    put:
      operationId: updateNote
      summary: Update note
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                title: { type: string }
                content: { type: string }
                appendContent: { type: boolean }
      responses:
        '200': { description: Note updated }
    delete:
      operationId: deleteNote
      summary: Delete note
      security:
        - SyncApiKey: []
      parameters:
        - in: path
          name: id
          required: true
          schema: { type: string }
      responses:
        '200': { description: Note deleted }
  /api/sync/summary:
    get:
      operationId: fetchTaskSummary
      summary: Fetch task summary
      security:
        - SyncApiKey: []
      parameters:
        - in: query
          name: date
          schema: { type: string, pattern: '^\d{4}-\d{2}-\d{2}$' }
      responses:
        '200': { description: Task summary fetched }
  /api/sync/single:
    post:
      operationId: syncSingleTask
      summary: Legacy single-task sync helper
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [title]
              properties:
                title: { type: string }
                date: { type: string, pattern: '^\d{4}-\d{2}-\d{2}$' }
      responses:
        '201': { description: Task synced }
  /api/sync:
    post:
      operationId: syncTasks
      summary: Legacy multi-task sync helper
      security:
        - SyncApiKey: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [tasks]
              properties:
                tasks:
                  type: array
                  minItems: 1
                  maxItems: 100
                  items:
                    type: object
                    required: [title]
                    properties:
                      title: { type: string }
      responses:
        '201': { description: Tasks synced }
components:
  securitySchemes:
    SyncApiKey:
      type: apiKey
      in: header
      name: x-sync-api-key
`;

const REQUIRED_SCHEMA_TOKENS = [
  'openapi: 3.1.0',
  '/api/sync/projects:',
  '/api/sync/epics:',
  '/api/sync/tasks:',
  '/api/sync/notes:',
  'operationId: createProject',
  'operationId: createEpic',
  'operationId: createTask',
  'operationId: createNote',
  'operationId: fetchTaskSummary',
  'name: x-sync-api-key'
];

export const validateSyncActionSchema = (schema: string): string[] => {
  const errors: string[] = [];

  if (!schema.trim()) {
    return ['Schema is empty.'];
  }

  for (const token of REQUIRED_SCHEMA_TOKENS) {
    if (!schema.includes(token)) {
      errors.push(`Missing required schema token: ${token}`);
    }
  }

  const pathCount = (schema.match(/^ {2}\/api\/sync\//gm) ?? []).length;

  if (pathCount < 6) {
    errors.push('Schema must declare all sync CRUD paths.');
  }

  if (!schema.includes('parentType') || !schema.includes('parentId')) {
    errors.push('Schema must describe polymorphic note fields parentType and parentId.');
  }

  return errors;
};
