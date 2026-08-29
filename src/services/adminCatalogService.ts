const API_BASE_URL = "http://127.0.0.1:8000";

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token");

    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

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
    const response = await fetch(
        `${API_BASE_URL}/api/admin/event-types/by-project/${projectId}`,
        {
            headers: getAuthHeaders(),
        },
    );

    if (!response.ok) {
        throw new Error(`Failed to load event types: HTTP ${response.status}`);
    }

    return response.json();
}

export async function listSchemasByEventType(
    eventTypeId: number,
): Promise<SchemaDefinitionRead[]> {
    const response = await fetch(
        `${API_BASE_URL}/api/admin/event-types/${eventTypeId}/schemas`,
        {
            headers: getAuthHeaders(),
        },
    );

    if (!response.ok) {
        throw new Error(`Failed to load schemas: HTTP ${response.status}`);
    }

    return response.json();
}