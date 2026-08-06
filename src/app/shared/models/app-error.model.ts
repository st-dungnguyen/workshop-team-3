export interface AppError {
  status: number | null;
  message: string;
  code?: string;
}
