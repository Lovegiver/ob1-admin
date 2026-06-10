import type {RuntimeEvent} from "./RuntimeEvent";
import { RuntimeEventType } from "./RuntimeEventType";
import { RuntimeSeverity } from "./RuntimeSeverity";

export function resolveRuntimeSeverity(event: RuntimeEvent): RuntimeSeverity {
    switch (event.type) {
        case RuntimeEventType.DeliverySucceeded:
            return RuntimeSeverity.Success;

        case RuntimeEventType.EventUnroutable:
        case RuntimeEventType.DeliveryFailed:
        case RuntimeEventType.DeadLetterRetryRequested:
            return RuntimeSeverity.Warning;

        case RuntimeEventType.EventFailed:
        case RuntimeEventType.DeliveryDeadLettered:
            return RuntimeSeverity.Error;

        case RuntimeEventType.EventCompleted:
        case RuntimeEventType.EventRouted:
        case RuntimeEventType.MetricsExtracted:
        case RuntimeEventType.EventReceived:
            return RuntimeSeverity.Info;

        case RuntimeEventType.WorkerCycleStarted:
        case RuntimeEventType.WorkerCycleFinished:
        case RuntimeEventType.ProcessingChainActivated:
        default:
            return RuntimeSeverity.Info;
    }
}

export function resolveRuntimeTitle(event: RuntimeEvent): string {
    return event.type;
}

export function resolveRuntimeDescription(event: RuntimeEvent): string {
    return event.message ?? event.type;
}

export function isDeliverySuccess(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.DeliverySucceeded;
}

export function isDeliveryFailure(event: RuntimeEvent): boolean {
    return (
        event.type === RuntimeEventType.DeliveryFailed ||
        event.type === RuntimeEventType.DeliveryDeadLettered
    );
}

export function isRetry(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.DeadLetterRetryRequested;
}

export function isEventReceived(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.EventReceived;
}

export function isMetricsExtracted(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.MetricsExtracted;
}

export function isDeadLetterRetryRequested(
    event: RuntimeEvent,
): boolean {
    return (
        event.type === RuntimeEventType.DeadLetterRetryRequested
    );
}

export function isDeliveryDeadLettered(
    event: RuntimeEvent,
): boolean {
    return (
        event.type === RuntimeEventType.DeliveryDeadLettered
    );
}

export function isEventRouted(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.EventRouted;
}

export function isEventCompleted(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.EventCompleted;
}

export function isEventUnroutable(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.EventUnroutable;
}

export function isEventFailed(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.EventFailed;
}

export function isDeliveryStarted(event: RuntimeEvent): boolean {
    return event.type === RuntimeEventType.DeliveryStarted;
}

export function isInfrastructureEvent(event: RuntimeEvent): boolean {
    return (
        event.type === RuntimeEventType.WorkerCycleStarted ||
        event.type === RuntimeEventType.WorkerCycleFinished
    );
}