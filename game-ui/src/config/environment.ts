export const environment = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  isLocal: import.meta.env.VITE_ENV === 'local',
};
