export const RuntimeDeliveryStatus = {
    Pending: "PENDING",
    Delivered: "DELIVERED",
    Failed: "FAILED",
    DeadLetter: "DEAD_LETTER",
} as const;

export type RuntimeDeliveryStatus =
    (typeof RuntimeDeliveryStatus)[keyof typeof RuntimeDeliveryStatus];