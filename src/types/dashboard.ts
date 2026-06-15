export type DashboardMetricStatus = "healthy" | "warning" | "critical" | "neutral";

export interface DashboardMetric {
    label: string;
    value: number | string;
    description: string;
    status: DashboardMetricStatus;
}