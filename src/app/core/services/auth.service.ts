import AuthHelper from '../helpers/auth.helper';
import { ENDPOINT } from '@config/endpoint';
import { ApiService } from './api.service';

type SignInBody = {
  username: string;
  password: string;
};
export class AuthService extends AuthHelper {
  http = new ApiService();

  constructor() {
    super();
  }

  async signIn<T>(body: SignInBody): Promise<T> {
    /* this is the default signIn,
      If you want to override it, please write the same function in specific type of auth.
    */
    return this.http.post<T>([ENDPOINT.auth.login], body);
  }

  signOut() {
    this.removeToken();
  }
}
