export const RuntimeSeverity = {
    Info: "info",
    Success: "success",
    Warning: "warning",
    Error: "error",
} as const;

export type RuntimeSeverity =
    (typeof RuntimeSeverity)[keyof typeof RuntimeSeverity];