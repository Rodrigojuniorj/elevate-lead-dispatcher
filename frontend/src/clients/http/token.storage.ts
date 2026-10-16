const tokenKey = 'elevate.access-token';

export const tokenStorage = {
  get: (): string | null => sessionStorage.getItem(tokenKey),
  set: (token: string): void => sessionStorage.setItem(tokenKey, token),
  clear: (): void => sessionStorage.removeItem(tokenKey),
};
