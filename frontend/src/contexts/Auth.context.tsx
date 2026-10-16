import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import { getCurrentUser } from '../apis/auth/getCurrentUser.api';
import { postLogin } from '../apis/auth/postLogin.api';
import { tokenStorage } from '../clients/http/token.storage';
import type { AuthenticatedUser } from '../types/auth/AuthenticatedUser.type';

type AuthContextValue = { isLoading: boolean; user: AuthenticatedUser | null; signIn: (email: string, password: string) => Promise<void>; signOut: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  useEffect(() => { void getCurrentUser().then((currentUser) => { setUser(currentUser); setIsLoading(false); }); }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isLoading,
    user,
    signIn: async (email, password) => {
      await postLogin(email, password);
      setUser(await getCurrentUser());
    },
    signOut: () => { tokenStorage.clear(); setUser(null); },
  }), [isLoading, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
