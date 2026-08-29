import { tokenStorage } from "@/auth/tokenStorage";
import { getApiBaseUrl } from "@/config/environment";
import { httpEvents } from "@/services/httpEvents";

export interface PublicApiError {
    status?: number;
    code?: string;
    message: string;
    details?: unknown;
    isNetworkError: boolean;
}

export class ApiError extends Error implements PublicApiError {
    readonly status?: number;
    readonly code?: string;
    readonly details?: unknown;
    readonly isNetworkError: boolean;

    constructor(error: PublicApiError) {
        super(error.message);
        this.name = "ApiError";
        this.status = error.status;
        this.code = error.code;
        this.details = error.details;
        this.isNetworkError = error.isNetworkError;
    }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
    body?: unknown;
    token?: string | null;
}

function sanitizeText(value: string): string {
    return value.replace(
        /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
        "[REDACTED]",
    );
}

function sanitizeDetails(value: unknown): unknown {
    if (typeof value === "string") {
        return sanitizeText(value);
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeDetails);
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .filter(([key]) => !/(authorization|password|secret|token)/i.test(key))
                .map(([key, nestedValue]) => [key, sanitizeDetails(nestedValue)]),
        );
    }

    return value;
}

function safeErrorFromBody(status: number, body: unknown): PublicApiError {
    const record = body && typeof body === "object"
        ? body as Record<string, unknown>
        : undefined;
    const detail = record?.detail;
    const backendMessage = typeof detail === "string"
        ? detail
        : typeof record?.message === "string"
            ? record.message
            : undefined;
    const code = typeof record?.code === "string"
        ? record.code
        : typeof record?.error_code === "string"
            ? record.error_code
            : undefined;

    return {
        status,
        code,
        message: backendMessage
            ? sanitizeText(backendMessage)
            : `La requête a échoué (HTTP ${status}).`,
        details: detail && typeof detail !== "string"
            ? sanitizeDetails(detail)
            : undefined,
        isNetworkError: false,
    };
}

async function parseError(response: Response): Promise<PublicApiError> {
    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("application/json")) {
        return safeErrorFromBody(response.status, undefined);
    }

    try {
        return safeErrorFromBody(response.status, await response.json());
    } catch {
        return safeErrorFromBody(response.status, undefined);
    }
}

export async function apiRequest<T = void>(
    path: string,
    options: ApiRequestOptions = {},
): Promise<T> {
    if (!path.startsWith("/")) {
        throw new ApiError({
            message: "Le chemin API doit être relatif à la base configurée.",
            isNetworkError: false,
        });
    }

    const {
        body,
        token: tokenOverride,
        ...requestOptions
    } = options;
    const headers = new Headers(requestOptions.headers);
    const token = tokenOverride === undefined ? tokenStorage.read() : tokenOverride;
    const hasBody = body !== undefined && body !== null;

    headers.set("Accept", "application/json");

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (hasBody && !(body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    let response: Response;

    try {
        response = await fetch(`${getApiBaseUrl()}${path}`, {
            ...requestOptions,
            headers,
            body: hasBody
                ? body instanceof FormData
                    ? body
                    : JSON.stringify(body)
                : undefined,
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
            throw error;
        }

        throw new ApiError({
            message: "Impossible de joindre le service. Vérifiez votre connexion.",
            isNetworkError: true,
        });
    }

    if (!response.ok) {
        const publicError = await parseError(response);

        if (response.status === 401) {
            tokenStorage.clear();
            httpEvents.unauthorized();
        } else if (response.status === 403) {
            httpEvents.forbidden();
        }

        throw new ApiError(publicError);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
}
