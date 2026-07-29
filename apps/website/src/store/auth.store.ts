import { create } from "zustand";
import { rotateVisitorJourney } from "@/lib/visitor";

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
  hasRestoredAuth: boolean;

  login: (
    user: AuthUser,
    accessToken: string
  ) => void;

  updateUser: (
    changes: Partial<AuthUser>
  ) => void;

  logout: () => void;
  restoreAuth: () => void;
};

export const useAuthStore =
  create<AuthState>((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    hasRestoredAuth: false,

    login: (
      user,
      accessToken
    ) => {
      localStorage.setItem(
        "kech_user",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "kech_access_token",
        accessToken
      );

      set({
        user,
        accessToken,
        isAuthenticated: true,
        hasRestoredAuth: true,
      });

      window.dispatchEvent(
        new Event(
          "kech-auth-change"
        )
      );
    },

    updateUser: (changes) => {
      const currentUser =
        get().user;

      if (!currentUser) {
        return;
      }

      const updatedUser: AuthUser = {
        ...currentUser,
        ...changes,
      };

      localStorage.setItem(
        "kech_user",
        JSON.stringify(
          updatedUser
        )
      );

      set({
        user: updatedUser,
      });

      window.dispatchEvent(
        new Event(
          "kech-auth-change"
        )
      );
    },

    logout: () => {
      localStorage.removeItem(
        "kech_user"
      );

      localStorage.removeItem(
        "kech_access_token"
      );

      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        hasRestoredAuth: true,
      });

      rotateVisitorJourney();

      window.dispatchEvent(
        new Event(
          "kech-auth-change"
        )
      );
    },

    restoreAuth: () => {
      const storedUser =
        localStorage.getItem(
          "kech_user"
        );

      const storedToken =
        localStorage.getItem(
          "kech_access_token"
        );

      if (
        !storedUser ||
        !storedToken
      ) {
        localStorage.removeItem(
          "kech_user"
        );

        localStorage.removeItem(
          "kech_access_token"
        );

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          hasRestoredAuth: true,
        });

        return;
      }

      try {
        const parsedUser =
          JSON.parse(
            storedUser
          ) as AuthUser;

        if (
          !parsedUser ||
          typeof parsedUser.id !==
            "string" ||
          typeof parsedUser.firstName !==
            "string" ||
          typeof parsedUser.lastName !==
            "string" ||
          typeof parsedUser.email !==
            "string"
        ) {
          throw new Error(
            "INVALID_STORED_USER"
          );
        }

        set({
          user: parsedUser,
          accessToken:
            storedToken,
          isAuthenticated: true,
          hasRestoredAuth: true,
        });
      } catch (error) {
        console.error(
          "Unable to restore authentication:",
          error
        );

        localStorage.removeItem(
          "kech_user"
        );

        localStorage.removeItem(
          "kech_access_token"
        );

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          hasRestoredAuth: true,
        });

        window.dispatchEvent(
          new Event(
            "kech-auth-change"
          )
        );
      }
    },
  }));
