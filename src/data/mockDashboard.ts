import type { DashboardMetric } from "../types/dashboard";

export const dashboardMetrics: DashboardMetric[] = [
    { label: "Events received", value: 1248, description: "Total events accepted by OB1", status: "healthy" },
    { label: "Routed", value: 1197, description: "Events routed to active destinations", status: "healthy" },
    { label: "Delivered", value: 1132, description: "Successful downstream deliveries", status: "healthy" },
    { label: "Dead-letter", value: 7, description: "Events requiring operator attention", status: "critical" },
    { label: "Observations", value: 842, description: "Analytical observations produced", status: "neutral" },
];

export interface ProcessingChain {
    id: number;
    project: string;
    eventType: string;
    yamlVersion: string;
    jsonVersion: string;
    plans: number;
    observations: number;
    status: "active" | "draft";
}

export const processingChainsMock: ProcessingChain[] = [
    {
        id: 1,
        project: "BlackHole",
        eventType: "BlackHoleArticleAnalyzed",
        yamlVersion: "1.0",
        jsonVersion: "1.0",
        plans: 4,
        observations: 842,
        status: "active",
    },
    {
        id: 2,
        project: "OB1",
        eventType: "EventDeliveryStatusChanged",
        yamlVersion: "0.2",
        jsonVersion: "1.0",
        plans: 2,
        observations: 136,
        status: "draft",
    },
];