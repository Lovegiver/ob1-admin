export type DashboardMetricStatus = "healthy" | "warning" | "critical" | "neutral";

export interface DashboardMetric {
    label: string;
    value: number;
    description: string;
    status: DashboardMetricStatus;
}

export interface ActivityItem {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    severity: "info" | "success" | "warning" | "error";
}