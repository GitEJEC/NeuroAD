import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, api, clearSession, loadSession, saveSession, setUnauthorizedHandler, type User } from './client';

type Session = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    // Stored token + user → straight in; an expired token logs out on its first 401.
    loadSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });
    // Same message as a wrong password, so the app does not confirm a therapist's credentials.
    if (res.user.role !== 'patient') throw new ApiError(401, 'Correo o contraseña incorrectos');
    await saveSession(res.access_token, res.user);
    setUser(res.user);
  }

  async function logout() {
    await clearSession();
    setUser(null);
  }

  return <SessionContext.Provider value={{ user, loading, login, logout }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside SessionProvider');
  return session;
}
