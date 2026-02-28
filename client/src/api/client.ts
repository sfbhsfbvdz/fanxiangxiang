// 生产环境用 VITE_API_URL，开发环境走 Vite proxy
const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '') + '/api';

const TOKEN_KEY = 'fanfou_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  remove: () => localStorage.removeItem(TOKEN_KEY),
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  endpoint: string,
  data?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = tokenStorage.get();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    tokenStorage.remove();
    window.dispatchEvent(new Event('auth:logout'));
  }

  const json = await response.json();

  if (!response.ok) {
    const message = json?.error?.message || json?.message || `请求失败 (${response.status})`;
    const code = json?.error?.code;
    throw new ApiError(response.status, message, code);
  }

  return json;
}

export const apiClient = {
  get: <T>(endpoint: string) => request<T>('GET', endpoint),
  post: <T>(endpoint: string, data: unknown) => request<T>('POST', endpoint, data),
  put: <T>(endpoint: string, data: unknown) => request<T>('PUT', endpoint, data),
  delete: <T>(endpoint: string) => request<T>('DELETE', endpoint),
};

export { ApiError };
