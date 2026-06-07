import { createContext } from "react";
import type { RuntimeActivity } from "@/components/dashboard/ActivityFeed.tsx";

export type RuntimeConnectionStatus = "connected" | "disconnected";

export interface RuntimeMetrics {
    eventsReceived: number;
    delivered: number;
    observations: number;
    retries: number;
    deadLetters: number;
}

export interface RuntimeMetricsHistoryPoint {
    timestamp: number;
    eventsReceived: number;
    delivered: number;
    observations: number;
    retries: number;
    deadLetters: number;
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