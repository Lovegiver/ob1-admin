import { createContext } from "react";
import type { RuntimeActivity } from "@/components/dashboard/ActivityFeed.tsx";

export type RuntimeConnectionStatus = "connected" | "disconnected";

export interface RuntimeMetrics {
    eventsTotal: number;
    pendingEvents: number;
    oldestReceivedAgeSeconds: number | null;
    oldestPendingDeliveryAgeSeconds: number | null;

    eventsRouted: number;
    eventsUnroutable: number;
    eventsFailed: number;

    deliveriesCreated: number;
    deliveriesSucceeded: number;
    deliveriesFailed: number;
    pendingDeliveries: number;

    retries: number;
    deadLetters: number;

    observations: number;

    summaryGeneratedAt: string | null;
}

export interface RuntimeMetricsHistoryPoint {
    timestamp: number;

    eventsReceived: number;

    eventsRouted: number;
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
    workerHealth: WorkerHealth;
}

export const RuntimeContext =
    createContext<RuntimeContextValue | null>(null);

export interface WorkerHealth {
    lastStartedAt: string | null;
    lastFinishedAt: string | null;
    lastHeartbeatAt: string | null;
    status: "unknown" | "healthy" | "stale";
}