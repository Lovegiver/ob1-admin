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

export async function validateMetricYaml(
    eventTypeId: number,
    request: MetricYamlValidationRequest,
): Promise<MetricYamlValidationResponse> {

    return apiRequest<MetricYamlValidationResponse>(
        `/api/admin/event-types/${eventTypeId}/metric-definitions/yaml/validate`,
        {
            method: "POST",
            body: request,
        },
    );
}

export async function previewMetricYaml(
    eventTypeId: number,
    request: MetricYamlValidationRequest,
): Promise<MetricYamlPreviewResponse> {

    return apiRequest<MetricYamlPreviewResponse>(
        `/api/admin/event-types/${eventTypeId}/metric-definitions/yaml/preview`,
        {
            method: "POST",
            body: request,
        },
    );
}
import { apiRequest } from "@/services/apiClient";
