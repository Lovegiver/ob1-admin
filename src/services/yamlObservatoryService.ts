export interface MetricYamlValidationRequest {
    schema_definition_id: number;
    yaml_content: string;
}

export interface MetricYamlValidationResponse {
    valid: boolean;
    errors: string[];
}

export interface MetricYamlPreviewResponse {
    valid: boolean;
    errors: string[];
    compiled_plan_json: Record<string, unknown> | null;
}

const API_BASE_URL = "http://127.0.0.1:8000";

export async function validateMetricYaml(
    eventTypeId: number,
    request: MetricYamlValidationRequest,
): Promise<MetricYamlValidationResponse> {

    localStorage.setItem("access_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJmcmVkZXJpYy5jb3VyY2llckBnbWFpbC5jb20iLCJyb2xlIjoiVVNFUiIsImV4cCI6MTc4MjI5MDMwN30.G4pOEsyZ6cCttm0pmppGmoCGiWS3Yg4XStQ9BVJ5F8g")

    function getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem("access_token");

        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }

    const response = await fetch(
        `${API_BASE_URL}/api/admin/event-types/${eventTypeId}/metric-definitions/yaml/validate`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        },
    );

    if (!response.ok) {
        throw new Error(`YAML validation failed with HTTP ${response.status}`);
    }

    return response.json();
}

export async function previewMetricYaml(
    eventTypeId: number,
    request: MetricYamlValidationRequest,
): Promise<MetricYamlPreviewResponse> {

    localStorage.setItem("access_token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJmcmVkZXJpYy5jb3VyY2llckBnbWFpbC5jb20iLCJyb2xlIjoiVVNFUiIsImV4cCI6MTc4MjI5MDMwN30.G4pOEsyZ6cCttm0pmppGmoCGiWS3Yg4XStQ9BVJ5F8g")

    function getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem("access_token");

        return {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }

    const response = await fetch(
        `${API_BASE_URL}/api/admin/event-types/${eventTypeId}/metric-definitions/yaml/preview`,
        {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(request),
        },
    );

    if (!response.ok) {
        throw new Error(`YAML preview failed with HTTP ${response.status}`);
    }

    return response.json();
}