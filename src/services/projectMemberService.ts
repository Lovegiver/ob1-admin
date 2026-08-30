import { ApiError, apiRequest } from "@/services/apiClient";
import { projectPathSegment } from "@/services/projectService";

export const projectMemberRoles = ["OWNER", "DEVELOPER", "VIEWER"] as const;
export type ProjectMemberRole = typeof projectMemberRoles[number];

export interface ProjectMember {
    user_id: number;
    email: string;
    role: ProjectMemberRole;
}

export interface AddProjectMemberRequest {
    email: string;
    role: ProjectMemberRole;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isProjectMemberRole(value: unknown): value is ProjectMemberRole {
    return typeof value === "string" && projectMemberRoles.some((role) => role === value);
}

function parseProjectMember(value: unknown): ProjectMember {
    if (
        !isRecord(value) ||
        typeof value.user_id !== "number" ||
        !Number.isSafeInteger(value.user_id) ||
        typeof value.email !== "string" ||
        !isProjectMemberRole(value.role)
    ) {
        throw new ApiError({
            message: "Le service a renvoyé un membre invalide.",
            isNetworkError: false,
        });
    }

    return {
        user_id: value.user_id,
        email: value.email,
        role: value.role,
    };
}

function userPathSegment(userId: number): string {
    if (!Number.isSafeInteger(userId) || userId <= 0) {
        throw new ApiError({
            message: "Identifiant utilisateur invalide.",
            isNetworkError: false,
        });
    }

    return encodeURIComponent(String(userId));
}

function membersPath(projectId: number): string {
    return `/api/admin/projects/${projectPathSegment(projectId)}/members`;
}

export async function listProjectMembers(
    projectId: number,
    signal?: AbortSignal,
): Promise<ProjectMember[]> {
    const response = await apiRequest<unknown>(membersPath(projectId), { signal });

    if (!Array.isArray(response)) {
        throw new ApiError({
            message: "Le service a renvoyé une liste de membres invalide.",
            isNetworkError: false,
        });
    }

    return response.map(parseProjectMember);
}

export async function addProjectMember(
    projectId: number,
    request: AddProjectMemberRequest,
): Promise<ProjectMember> {
    const response = await apiRequest<unknown>(membersPath(projectId), {
        method: "POST",
        body: request,
        forbidden: "local",
    });

    return parseProjectMember(response);
}

export async function updateProjectMemberRole(
    projectId: number,
    userId: number,
    role: ProjectMemberRole,
): Promise<ProjectMember> {
    const response = await apiRequest<unknown>(
        `${membersPath(projectId)}/${userPathSegment(userId)}/role`,
        {
            method: "PATCH",
            body: { role },
            forbidden: "local",
        },
    );

    return parseProjectMember(response);
}

export function removeProjectMember(
    projectId: number,
    userId: number,
): Promise<void> {
    return apiRequest<void>(
        `${membersPath(projectId)}/${userPathSegment(userId)}`,
        { method: "DELETE", forbidden: "local" },
    );
}
