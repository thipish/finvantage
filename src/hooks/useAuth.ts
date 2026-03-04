import { useState, useEffect, useCallback } from "react";

const SESSION_KEY = "finvantage_session";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AuthSession {
  user: { name: string; email: string };
  expiresAt: number;
}

interface AuthUser {
  name: string;
  email: string;
}

function getValidSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session.user;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * WARNING: This is a client-side only auth stub for demo/prototype use.
 * For production, replace with a proper auth provider (e.g. Supabase Auth,
 * Firebase Auth) that issues server-validated tokens.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getValidSession());
    setLoading(false);
  }, []);

  const login = useCallback((name: string, email: string) => {
    const session: AuthSession = {
      user: { name, email },
      expiresAt: Date.now() + SESSION_MAX_AGE_MS,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(session.user);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
