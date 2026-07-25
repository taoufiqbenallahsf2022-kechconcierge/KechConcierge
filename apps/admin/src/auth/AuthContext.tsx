import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminApi, API_BASE_URL } from "../store/api";

export type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type AuthContextValue = {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function authRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}/auth${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? "Unable to authenticate");
  }
  return response.status === 204 ? null : response.json();
}

export function AuthProvider({
  children,
  store,
}: {
  children: ReactNode;
  store: { dispatch: (action: unknown) => unknown };
}) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    store.dispatch(adminApi.util.resetApiState());
  }, [store]);

  useEffect(() => {
    authRequest("/session")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener("admin:unauthorized", clearSession);
    return () =>
      window.removeEventListener("admin:unauthorized", clearSession);
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const data = await authRequest("/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setUser(data.user);
      },
      logout: async () => {
        try {
          await authRequest("/logout", { method: "POST" });
        } finally {
          clearSession();
        }
      },
    }),
    [clearSession, loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
