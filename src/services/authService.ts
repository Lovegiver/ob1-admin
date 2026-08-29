import { apiRequest } from "@/services/apiClient";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: "bearer";
}

export interface AuthenticatedUser {
    id: number;
    email: string;
    role: string;
    permissions?: readonly string[];
}

export function authenticate(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: credentials,
        token: null,
    });
}

export function fetchCurrentUser(signal?: AbortSignal): Promise<AuthenticatedUser> {
    return apiRequest<AuthenticatedUser>("/auth/me", { signal });
}
