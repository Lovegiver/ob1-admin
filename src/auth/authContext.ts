import { createContext } from "react";

import type {
    AuthenticatedUser,
    LoginCredentials,
} from "@/services/authService";

export type AuthStatus =
    | "RESTORING"
    | "ANONYMOUS"
    | "AUTHENTICATING"
    | "AUTHENTICATED";

export interface AuthContextValue {
    status: AuthStatus;
    user: AuthenticatedUser | null;
    error: string | null;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
