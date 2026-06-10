export const RuntimeCategory = {
    Event: "event",
    Delivery: "delivery",
    Metrics: "metrics",
    Infrastructure: "infrastructure",
} as const;

export type RuntimeCategory =
    (typeof RuntimeCategory)[keyof typeof RuntimeCategory];