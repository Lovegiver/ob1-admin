import { ApiError, apiRequest } from "@/services/apiClient";

export interface Project {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
}

export interface CreateProjectRequest {
    name: string;
    description: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProject(value: unknown): Project {
    if (
        !isRecord(value) ||
        typeof value.id !== "number" ||
        !Number.isSafeInteger(value.id) ||
        typeof value.name !== "string" ||
        !(typeof value.description === "string" || value.description === null) ||
        typeof value.is_active !== "boolean"
    ) {
        throw new ApiError({
            message: "Le service a renvoyé un Project invalide.",
            isNetworkError: false,
        });
    }

    return {
        id: value.id,
        name: value.name,
        description: value.description,
        is_active: value.is_active,
    };
}

export function projectPathSegment(projectId: number): string {
    if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        throw new ApiError({
            message: "Identifiant de Project invalide.",
            isNetworkError: false,
        });
    }

    return encodeURIComponent(String(projectId));
}

export async function listProjects(signal?: AbortSignal): Promise<Project[]> {
    const response = await apiRequest<unknown>("/api/admin/projects", { signal });

    if (!Array.isArray(response)) {
        throw new ApiError({
            message: "Le service a renvoyé une liste de Projects invalide.",
            isNetworkError: false,
        });
    }

    return response.map(parseProject);
}

export async function createProject(
    request: CreateProjectRequest,
): Promise<Project> {
    const response = await apiRequest<unknown>("/api/admin/projects", {
        method: "POST",
        body: request,
    });

    return parseProject(response);
}

export async function disableProject(projectId: number): Promise<Project> {
    const response = await apiRequest<unknown>(
        `/api/admin/projects/${projectPathSegment(projectId)}/disable`,
        { method: "PATCH", forbidden: "local" },
    );

    return parseProject(response);
}
