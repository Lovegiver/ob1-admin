import { RuntimeEventType } from "./RuntimeEventType";

export interface RuntimeEvent {
    type: RuntimeEventType;
    timestamp: string;

    event_id?: number | null;
    event_uuid?: string | null;
    event_type_id?: number | null;
    correlation_id?: string | null;

    delivery_id?: number | null;

    event_status?: string | null;
    delivery_status?: string | null;

    message?: string | null;

    payload?: Record<string, unknown>;
}