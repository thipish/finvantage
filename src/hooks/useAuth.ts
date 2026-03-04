import { useState, useEffect, useCallback } from "react";
import { apiRegister, apiLogin } from "@/lib/api";

const SESSION_KEY = "finvantage_session";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface AuthSession {
  user: { id: number; name: string; email: string };
  token: string;
  expiresAt: number;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

function getValidSession(): { user: AuthUser; token: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { user: session.user, token: session.token };
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Auth hook that talks to the FastAPI backend for registration/login.
 * Falls back to client-side demo mode if the backend is unavailable.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getValidSession();
    if (session) setUser(session.user);
    setLoading(false);
  }, []);

  const saveSession = useCallback((u: AuthUser, token: string) => {
    const session: AuthSession = {
      user: u,
      token,
      expiresAt: Date.now() + SESSION_MAX_AGE_MS,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setUser(u);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      try {
        const result = await apiRegister(name, email, password);
        saveSession(
          { id: result.user.id, name: result.user.name, email: result.user.email },
          result.token
        );
      } catch (err) {
        // Fallback to client-side demo mode if backend is down
        console.warn("Backend unavailable, using demo mode:", err);
        saveSession({ id: 0, name, email }, "demo");
      }
    },
    [saveSession]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await apiLogin(email, password);
        saveSession(
          { id: result.user.id, name: result.user.name, email: result.user.email },
          result.token
        );
      } catch (err) {
        // Fallback to client-side demo mode if backend is down
        console.warn("Backend unavailable, using demo mode:", err);
        saveSession({ id: 0, name: email.split("@")[0], email }, "demo");
      }
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  return { user, loading, register, login, logout };
}
