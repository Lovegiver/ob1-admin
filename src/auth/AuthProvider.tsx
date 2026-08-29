import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AuthContext, type AuthStatus } from "@/auth/authContext";
import { tokenStorage } from "@/auth/tokenStorage";
import {
    authenticate,
    fetchCurrentUser,
    type AuthenticatedUser,
    type LoginCredentials,
} from "@/services/authService";
import { ApiError } from "@/services/apiClient";
import { httpEvents } from "@/services/httpEvents";

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [status, setStatus] = useState<AuthStatus>(() =>
        tokenStorage.read() ? "RESTORING" : "ANONYMOUS",
    );
    const [user, setUser] = useState<AuthenticatedUser | null>(null);
    const [error, setError] = useState<string | null>(null);

    const becomeAnonymous = useCallback(() => {
        tokenStorage.clear();
        setUser(null);
        setError(null);
        setStatus("ANONYMOUS");
    }, []);

    useEffect(() => {
        const abortController = new AbortController();
        const unsubscribe = httpEvents.onUnauthorized(becomeAnonymous);
        const token = tokenStorage.read();

        if (!token) {
            return () => {
                abortController.abort();
                unsubscribe();
            };
        }

        void fetchCurrentUser(abortController.signal)
            .then((currentUser) => {
                if (!abortController.signal.aborted) {
                    setUser(currentUser);
                    setStatus("AUTHENTICATED");
                }
            })
            .catch(() => {
                if (!abortController.signal.aborted) {
                    becomeAnonymous();
                }
            });

        return () => {
            abortController.abort();
            unsubscribe();
        };
    }, [becomeAnonymous]);

    const login = useCallback(async (credentials: LoginCredentials) => {
        setStatus("AUTHENTICATING");
        setError(null);

        try {
            const response = await authenticate(credentials);

            if (!tokenStorage.write(response.access_token)) {
                throw new ApiError({
                    message: "Le service a renvoyé une session invalide.",
                    isNetworkError: false,
                });
            }

            const currentUser = await fetchCurrentUser();
            setUser(currentUser);
            setStatus("AUTHENTICATED");
        } catch (caught) {
            tokenStorage.clear();
            setUser(null);
            setStatus("ANONYMOUS");

            const message = caught instanceof ApiError
                ? caught.message
                : "La connexion a échoué. Réessayez.";
            setError(message);
            throw caught;
        }
    }, []);

    const clearError = useCallback(() => setError(null), []);

    const value = useMemo(() => ({
        status,
        user,
        error,
        login,
        logout: becomeAnonymous,
        clearError,
    }), [status, user, error, login, becomeAnonymous, clearError]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
