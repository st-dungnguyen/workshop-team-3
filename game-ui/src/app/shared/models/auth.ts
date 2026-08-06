export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';

export type AuthErrorCode =
  | 'tokenMissing'
  | 'tokenExpired'
  | 'tokenInvalid'
  | 'unauthorized'
  | 'serverError';

export interface ValidateResult {
  success: boolean;
  userId: string;
}
