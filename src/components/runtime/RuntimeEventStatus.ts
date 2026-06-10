export const RuntimeEventStatus = {
    Received: "RECEIVED",
    Routed: "ROUTED",
    Unroutable: "UNROUTABLE",
    Failed: "FAILED",
} as const;

export type RuntimeEventStatus =
    (typeof RuntimeEventStatus)[keyof typeof RuntimeEventStatus];