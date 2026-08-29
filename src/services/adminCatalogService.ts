import { apiRequest } from "@/services/apiClient";

export interface EventTypeRead {
    id: number;
    project_id: number;
    code: string;
    name: string;
    description?: string | null;
    is_active: boolean;
}

export interface SchemaDefinitionRead {
    id: number;
    event_type_id: number;
    json_version_client?: string | null;
    json_version_internal: string;
    json_schema: Record<string, unknown>;
    is_active: boolean;
}

export async function listEventTypesByProject(
    projectId: number,
): Promise<EventTypeRead[]> {
    return apiRequest<EventTypeRead[]>(
        `/api/admin/event-types/by-project/${projectId}`,
    );
}

export async function listSchemasByEventType(
    eventTypeId: number,
): Promise<SchemaDefinitionRead[]> {
    return apiRequest<SchemaDefinitionRead[]>(
        `/api/admin/event-types/${eventTypeId}/schemas`,
    );
}
