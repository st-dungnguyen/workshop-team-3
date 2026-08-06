const env = import.meta.env.VITE_ENV ?? 'local';

export const environment = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  skylarkToken: import.meta.env.VITE_X_SKYLARK_TOKEN ?? '',
  clientVersion: `webview-mini-app-${env}`,
};
