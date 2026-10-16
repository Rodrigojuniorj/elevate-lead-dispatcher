import { apiClient } from '../../clients/http/api.client';
import { tokenStorage } from '../../clients/http/token.storage';

type LoginResponse = { accessToken: string };

export async function postLogin(email: string, password: string): Promise<void> {
  const response = await apiClient.request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  tokenStorage.set(response.accessToken);
}
