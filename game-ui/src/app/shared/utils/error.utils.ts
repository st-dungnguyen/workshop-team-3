import { AxiosError } from 'axios';
import { AppError } from '../models/app-error.model';

export const normalizeError = (error: unknown): AppError => {
  if (error instanceof AxiosError) {
    if (error.response) {
      return {
        status: error.response.status,
        message:
          (error.response.data as { message?: string })?.message ??
          'Server error. Please try again later.',
        code: String(error.response.status),
      };
    }
    return {
      status: null,
      message: 'Network error. Please try again.',
    };
  }
  return {
    status: null,
    message: 'An unexpected error occurred.',
  };
};
