import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './api.client';
import type { ApiError } from './api.client';
import { tokenStorage } from './token.storage';
import { unauthorizedEventName } from './unauthorized.event';

describe('apiClient', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the session token and preserves caller headers', async () => {
    tokenStorage.set('access-token');
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.request<{ ok: boolean }>('/health', {
      headers: { 'X-Request-Id': 'request-1' },
    })).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/api/health', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
        'X-Request-Id': 'request-1',
      }),
    }));
  });

  it('clears the session and emits an unauthorized event after a 401 response', async () => {
    tokenStorage.set('expired-token');
    const unauthorizedListener = vi.fn();
    window.addEventListener(unauthorizedEventName, unauthorizedListener);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })));

    await expect(apiClient.request('/private')).rejects.toMatchObject({ status: 401 } satisfies Pick<ApiError, 'status'>);

    expect(tokenStorage.get()).toBeNull();
    expect(unauthorizedListener).toHaveBeenCalledOnce();
    window.removeEventListener(unauthorizedEventName, unauthorizedListener);
  });
});
