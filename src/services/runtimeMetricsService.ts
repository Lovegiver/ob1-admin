export interface RuntimeMetricsSummaryResponse {
    generated_at: string;

    events_total: number;
    events_routed: number;
    events_unroutable: number;
    events_failed: number;

    deliveries_created: number;
    deliveries_pending: number;
    deliveries_succeeded: number;
    deliveries_failed: number;
    dead_letters: number;

    retry_count: number;

    pending_events: number;
    pending_deliveries: number;

    oldest_received_age_seconds: number | null;
    oldest_pending_delivery_age_seconds: number | null;
}

export async function fetchRuntimeMetricsSummary(): Promise<RuntimeMetricsSummaryResponse> {
    const response = await fetch(
        "http://127.0.0.1:8000/api/runtime/metrics/summary",
    );

    if (!response.ok) {
        throw new Error(
            `Failed to fetch runtime metrics summary: ${response.status}`,
        );
    }

    return response.json();
}