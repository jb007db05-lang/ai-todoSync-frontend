import api from '@/services/api';
import type { UserSearchResult } from '@/types/project';

interface UserSearchResponse {
  message: string;
  data: {
    users: UserSearchResult[];
  };
}

const searchUsersByEmail = async (email: string): Promise<UserSearchResult[]> => {
  const response = await api.get<UserSearchResponse>('/users/search', {
    params: { email }
  });

  return response.data.data.users;
};

export { searchUsersByEmail };
