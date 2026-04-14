import api from '@/services/api';
import type { CreateNoteInput, Note, UpdateNoteInput } from '@/types/note';

interface NoteListResponse {
  message: string;
  data: {
    notes: Note[];
  };
}

interface NoteResponse {
  message: string;
  data: {
    note: Note;
  };
}

interface DeleteNoteResponse {
  message: string;
  data: {
    noteId: string;
  };
}

const getProjectNotes = async (projectId: string): Promise<Note[]> => {
  const response = await api.get<NoteListResponse>(`/projects/${projectId}/notes`);
  return response.data.data.notes;
};

const getEpicNotes = async (projectId: string, epicId: string): Promise<Note[]> => {
  const response = await api.get<NoteListResponse>(`/projects/${projectId}/epics/${epicId}/notes`);
  return response.data.data.notes;
};

const getNote = async (noteId: string): Promise<Note> => {
  const response = await api.get<NoteResponse>(`/notes/${noteId}`);
  return response.data.data.note;
};

const createNote = async (projectId: string, payload: CreateNoteInput): Promise<Note> => {
  const response = await api.post<NoteResponse>(`/projects/${projectId}/notes`, payload);
  return response.data.data.note;
};

const createEpicNote = async (projectId: string, epicId: string, payload: CreateNoteInput): Promise<Note> => {
  const response = await api.post<NoteResponse>(`/projects/${projectId}/epics/${epicId}/notes`, payload);
  return response.data.data.note;
};

const updateNote = async (noteId: string, payload: UpdateNoteInput): Promise<Note> => {
  const response = await api.put<NoteResponse>(`/notes/${noteId}`, payload);
  return response.data.data.note;
};

const deleteNote = async (noteId: string): Promise<string> => {
  const response = await api.delete<DeleteNoteResponse>(`/notes/${noteId}`);
  return response.data.data.noteId;
};

export { createEpicNote, createNote, deleteNote, getEpicNotes, getNote, getProjectNotes, updateNote };
