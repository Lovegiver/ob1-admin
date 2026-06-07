export type DashboardMetricStatus = "healthy" | "warning" | "critical" | "neutral";

export interface DashboardMetric {
    label: string;
    value: number;
    description: string;
    status: DashboardMetricStatus;
}