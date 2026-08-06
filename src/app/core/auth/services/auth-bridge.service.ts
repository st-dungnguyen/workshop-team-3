import axios, { AxiosError } from 'axios';
import { environment } from '@config/environment';
import { ENDPOINT } from '@config/endpoint';
import type { AuthErrorCode, ValidateResult } from '@shared/models/auth';

interface BridgePayload {
  type: string;
  token?: unknown;
}

interface ErrorResponseData {
  code?: string;
}

export class AuthBridgeService {
  private readonly http = axios.create({
    baseURL: environment.apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
  });

  extractFromUrlParam(): string | null {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    return token && token.trim().length > 0 ? token : null;
  }

  extractFromBridgeMessage(event: MessageEvent): string | null {
    let payload: unknown;
    try {
      payload =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch {
      return null;
    }

    if (
      typeof payload !== 'object' ||
      payload === null ||
      (payload as BridgePayload).type !== 'AUTH_TOKEN'
    ) {
      return null;
    }

    const token = (payload as BridgePayload).token;
    if (typeof token !== 'string' || token.trim().length === 0) {
      return null;
    }

    return token;
  }

  async validate(token: string): Promise<ValidateResult> {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      await new Promise<void>((r) => setTimeout(r, 800));
      return { success: true, userId: 'demo-user' };
    }

    const response = await this.http.post<ValidateResult>(
      ENDPOINT.auth.validate,
      { token },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  }

  mapErrorToCode(error: unknown): AuthErrorCode {
    if (axios.isAxiosError(error)) {
      const axiosErr = error as AxiosError<ErrorResponseData>;
      const status = axiosErr.response?.status;
      const code = axiosErr.response?.data?.code;

      if (status === 401) return 'unauthorized';
      if (status === 403) {
        return code === 'TOKEN_EXPIRED' ? 'tokenExpired' : 'tokenInvalid';
      }
      if (status && status >= 500) return 'serverError';
    }
    return 'serverError';
  }
}
