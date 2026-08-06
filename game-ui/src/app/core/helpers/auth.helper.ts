import { InternalAxiosRequestConfig } from 'axios';
import JwtHelper from './jwt.helper';

export interface AuthHelperInterface {
  defaultHeader: () => void;
  getAuthHeader: () => void;
  isValidToken: () => boolean;
  isAuthenticated: () => boolean;
  isCurrentUser(uid: string): boolean;
  userRole: () => string | number;
  getUserInfo: () => void;
}

const strategies = {
  JWT: JwtHelper,
  __default__: JwtHelper,
};

class DynamicAuth {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;

  constructor(type: string) {
    const currentAuth = strategies[type];
    Object.setPrototypeOf(DynamicAuth.prototype, new currentAuth());
  }
}

// tslint:disable-next-line: max-classes-per-file
export default class AuthHelper extends DynamicAuth {
  constructor(type: string = 'JWT') {
    super(type);
  }

  defaultHeader() {
    if (super.defaultHeader) {
      return super.defaultHeader();
    }
    // default code here
  }

  getAuthHeader() {
    if (super.getAuthHeader) {
      return super.getAuthHeader();
    }
    // default code here
  }

  /**
   * Token conditions: custom checking access token
   * @method isValidToken
   * @return {boolean}    `true` : valid token for calling API
   *                      `false`: need to refresh access_token
   */
  isValidToken(): boolean {
    /**
     * Adding conditions here
     */
    // TODO

    if (super.isValidToken) {
      return super.isValidToken();
    }
    // default code here
  }

  setAuthHeader(
    request: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> | InternalAxiosRequestConfig {
    // Get and check access token
    if (this.getToken()) {
      // Check `access token` condition
      if (!this.isValidToken()) {
        return this.handleRefreshToken(request);
      }

      // Normal case: Request with authorization
      Object.assign(request.headers, this.getAuthHeader());
    }
    return request;
  }

  /**
   * Handle refresh token with current API request
   * @method handleRefreshToken
   * @param   [request] - current API request that have expired access_token or get 401 Unauthorized
   * @returns Promise<AxiosRequestConfig>
   */

  handleRefreshToken(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> {
    // TODO: handle refresh token
    return null;
  }
}
