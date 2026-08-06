import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import { environment } from '@config/environment';
import AuthHelper from '../helpers/auth.helper';

export class ApiService {
  axiosInstance: AxiosInstance;
  authHelper: AuthHelper;

  constructor() {
    this.authHelper = new AuthHelper();
    // Init axiosInstance
    this.axiosInstance = axios.create({
      baseURL: environment.apiBaseUrl,
      // Common header
      headers: {
        'Content-Type': 'application/json',
        ...this.authHelper.defaultHeader(),
      },
    });
    this._setInterceptors();
  }

  createURL(uri: (string | object)[]) {
    let paramsUrl;
    if (typeof uri[uri.length - 1] !== 'string') {
      paramsUrl = uri.pop();
      let url = uri.join('/');
      Object.keys(paramsUrl).forEach((x) => {
        url = url.replace(`:${x}`, paramsUrl[x]);
      });
      return url;
    } else {
      return uri.join('/');
    }
  }

  get<T>(uri: (string | object)[], params = {}, moreConfigs = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = this.axiosInstance.get(this.createURL(uri), {
        params,
        ...moreConfigs,
      });
      this._handleRespond(request, resolve, reject);
    });
  }

  post<T>(uri: (string | object)[], data = {}, moreConfigs = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = this.axiosInstance.post(
        this.createURL(uri),
        data,
        moreConfigs,
      );
      this._handleRespond(request, resolve, reject);
    });
  }

  put<T>(uri: (string | object)[], data = {}, moreConfigs = {}): Promise<T> {
    return new Promise((resolve, reject) => {
      const request = this.axiosInstance.put(
        this.createURL(uri),
        data,
        moreConfigs,
      );
      this._handleRespond(request, resolve, reject);
    });
  }

  delete(uri: (string | object)[], moreConfigs = {}) {
    return new Promise((resolve, reject) => {
      const request = this.axiosInstance.delete(
        this.createURL(uri),
        moreConfigs,
      );
      this._handleRespond(request, resolve, reject);
    });
  }

  multipleGets(apiRequests: string[]) {
    const apiReqs = apiRequests.map((v) => this.axiosInstance.get(v));
    return new Promise((resolve, reject) => {
      axios
        .all(apiReqs)
        .then((resp: AxiosResponse[]) => {
          resolve(resp.map((v) => v.data));
        })
        .catch((err: unknown) => reject(err));
    });
  }

  private _handleRespond(request: Promise<unknown>, resolve, reject) {
    return request
      .then((resp: AxiosResponse) => {
        resolve(resp.data);
      })
      .catch((err: unknown) => {
        reject(err);
      });
  }

  private _setInterceptors() {
    this.axiosInstance.interceptors.request.use((request) =>
      this.authHelper.setAuthHeader(request),
    );
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => this._handleError(error),
    );
  }

  private async _handleError(error: AxiosError) {
    // Detect refresh Token
    if (error.isAxiosError && error.response?.status === 401) {
      const originalRequest = error.config;
      const req = await this.authHelper.handleRefreshToken(originalRequest);
      return this.axiosInstance(req);
    }

    if (error.isAxiosError && error.response) {
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
}
