import { create } from "zustand";

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  login: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  restoreAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  login: (user, accessToken) => {
    localStorage.setItem("kech_user", JSON.stringify(user));
    localStorage.setItem("kech_access_token", accessToken);

    set({
      user,
      accessToken,
      isAuthenticated: true,
    });

    window.dispatchEvent(new Event("kech-auth-change"));
  },

  logout: () => {
    localStorage.removeItem("kech_user");
    localStorage.removeItem("kech_access_token");

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });

    window.dispatchEvent(new Event("kech-auth-change"));
  },

  restoreAuth: () => {
    const storedUser = localStorage.getItem("kech_user");
    const storedToken = localStorage.getItem("kech_access_token");

    if (!storedUser || !storedToken) {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
      return;
    }

    set({
      user: JSON.parse(storedUser),
      accessToken: storedToken,
      isAuthenticated: true,
    });
  },
}));