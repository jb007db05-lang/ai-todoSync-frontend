import axios from 'axios';

export interface NormalizedApiError {
  message: string;
  code: string;
  status?: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const normalizeApiError = (error: unknown): NormalizedApiError => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (isRecord(responseData)) {
      const message =
        typeof responseData.message === 'string'
          ? responseData.message
          : typeof responseData.error === 'string'
            ? responseData.error
            : error.message;
      const code =
        typeof responseData.code === 'string'
          ? responseData.code
          : `HTTP_${error.response?.status ?? 'UNKNOWN'}`;

      return {
        message,
        code,
        status: error.response?.status
      };
    }

    return {
      message: error.message || 'Request failed',
      code: `HTTP_${error.response?.status ?? 'UNKNOWN'}`,
      status: error.response?.status
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }

  return {
    message: 'Unexpected error',
    code: 'UNKNOWN_ERROR'
  };
};

export const toDisplayErrorMessage = (error: unknown): string =>
  normalizeApiError(error).message;
