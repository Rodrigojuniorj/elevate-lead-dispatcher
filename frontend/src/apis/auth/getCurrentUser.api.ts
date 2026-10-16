import { ApiError, apiClient } from '../../clients/http/api.client';
import { tokenStorage } from '../../clients/http/token.storage';
import type { AuthenticatedUser } from '../../types/auth/AuthenticatedUser.type';

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  if (!tokenStorage.get()) return null;
  try {
    return await apiClient.request<AuthenticatedUser>('/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) tokenStorage.clear();
    return null;
  }
}
