export const RuntimeEventType = {
    EventReceived: "EVENT_RECEIVED",

    EventRouted: "EVENT_ROUTED",
    EventCompleted: "EVENT_COMPLETED",
    EventUnroutable: "EVENT_UNROUTABLE",
    EventFailed: "EVENT_FAILED",

    DeliveryStarted: "DELIVERY_STARTED",
    DeliverySucceeded: "DELIVERY_SUCCEEDED",
    DeliveryFailed: "DELIVERY_FAILED",
    DeliveryDeadLettered: "DELIVERY_DEAD_LETTERED",

    DeadLetterRetryRequested: "DEAD_LETTER_RETRY_REQUESTED",

    MetricsExtracted: "METRICS_EXTRACTED",

    ProcessingChainActivated: "PROCESSING_CHAIN_ACTIVATED",

    WorkerCycleStarted: "WORKER_CYCLE_STARTED",
    WorkerCycleFinished: "WORKER_CYCLE_FINISHED",
} as const;

export type RuntimeEventType =
    (typeof RuntimeEventType)[keyof typeof RuntimeEventType];