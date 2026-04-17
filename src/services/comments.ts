import api from '@/services/api';

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
  createdAt: string;
}

interface CommentListResponse {
  message: string;
  data: {
    comments: Comment[];
  };
}

interface CommentResponse {
  message: string;
  data: {
    comment: Comment;
  };
}

const getComments = async (taskId: string): Promise<Comment[]> => {
  const response = await api.get<CommentListResponse>(`/tasks/${taskId}/comments`);
  return response.data.data.comments;
};

const addComment = async (taskId: string, content: string): Promise<Comment> => {
  const response = await api.post<CommentResponse>(`/tasks/${taskId}/comments`, { content });
  return response.data.data.comment;
};

export { getComments, addComment };
