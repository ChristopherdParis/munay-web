const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const override = window.localStorage.getItem('apiBaseUrl');
    if (override) {
      return override;
    }
  }
  return DEFAULT_API_BASE_URL;
};

export const getRealtimeUrl = (): string => {
  const base = getApiBaseUrl();
  if (base.endsWith('/api')) {
    return `${base.slice(0, -4)}/realtime`;
  }
  return `${base.replace(/\/$/, '')}/realtime`;
};
