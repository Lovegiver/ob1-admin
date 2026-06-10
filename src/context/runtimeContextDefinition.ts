import { createContext } from "react";
import type { RuntimeActivity } from "@/components/dashboard/ActivityFeed.tsx";

export type RuntimeConnectionStatus = "connected" | "disconnected";

export interface RuntimeMetrics {
    eventsReceived: number;

    eventsRouted: number;
    eventsCompleted: number;
    eventsUnroutable: number;
    eventsFailed: number;

    deliveriesSucceeded: number;
    deliveriesFailed: number;

    retries: number;
    deadLetters: number;

    observations: number;
}

export interface RuntimeMetricsHistoryPoint {
    timestamp: number;

    eventsReceived: number;

    eventsRouted: number;
    eventsCompleted: number;
    eventsUnroutable: number;
    eventsFailed: number;

    deliveriesSucceeded: number;
    deliveriesFailed: number;

    retries: number;
    deadLetters: number;

    observations: number;
}

export interface RuntimeContextValue {
    metrics: RuntimeMetrics;
    activities: RuntimeActivity[];
    connectionStatus: RuntimeConnectionStatus;
    history: RuntimeMetricsHistoryPoint[];
    isTimelinePaused: boolean;
    toggleTimelinePaused: () => void;
}

export const RuntimeContext =
    createContext<RuntimeContextValue | null>(null);

export interface WorkerHealth {
    lastStartedAt: string | null;
    lastFinishedAt: string | null;
    lastHeartbeatAt: string | null;
    status: "unknown" | "healthy" | "stale";
}