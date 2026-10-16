import { tokenStorage } from './token.storage';

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

class ApiClient {
  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = tokenStorage.get();
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    });
    if (!response.ok) {
      if (response.status === 401) tokenStorage.clear();
      throw new ApiError(response.status);
    }
    return response.json() as Promise<T>;
  }
}

export class ApiError extends Error {
  constructor(readonly status: number) { super(`API request failed with status ${status}`); }
}

export const apiClient = new ApiClient();
