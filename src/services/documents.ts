import api from "./api";

export interface Document {
  _id: string;
  projectId: string;
  workspaceId?: string;
  title: string;
  type: "PRD" | "SPEC" | "BRIEF" | "MEETING_NOTES" | "ARCHITECTURE" | "GENERAL";
  content: string;
  authorId: string;
  tags: string[];
  version: number;
  aiGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

export const documentService = {
  async getProjectDocuments(projectId: string): Promise<Document[]> {
    const res = await api.get<{ documents: Document[] }>(`/projects/${projectId}/documents`);
    return res.data.documents;
  },

  async createDocument(
    projectId: string,
    payload: { title: string; type?: string; content?: string; tags?: string[]; aiGenerated?: boolean },
  ): Promise<Document> {
    const res = await api.post<{ document: Document }>(`/projects/${projectId}/documents`, payload);
    return res.data.document;
  },

  async getDocumentById(docId: string): Promise<Document> {
    const res = await api.get<{ document: Document }>(`/documents/${docId}`);
    return res.data.document;
  },

  async updateDocument(
    docId: string,
    payload: { title?: string; type?: string; content?: string; tags?: string[] },
  ): Promise<Document> {
    const res = await api.patch<{ document: Document }>(`/documents/${docId}`, payload);
    return res.data.document;
  },

  async deleteDocument(docId: string): Promise<void> {
    await api.delete(`/documents/${docId}`);
  },
};

export default documentService;
