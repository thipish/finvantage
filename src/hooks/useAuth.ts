import { useState, useEffect, useCallback } from "react";

interface AuthUser {
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("finvantage_user");
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = useCallback((name: string, email: string) => {
    const u = { name, email };
    localStorage.setItem("finvantage_user", JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("finvantage_user");
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
