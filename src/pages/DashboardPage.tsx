import { MetricCard } from "@/components/dashboard/MetricCard.tsx";
import { useRuntime } from "@/context/useRuntime.ts";
import { RuntimeMetricsChart } from "@/components/dashboard/RuntimeMetricsChart.tsx";
import { RuntimeTimeline } from "@/components/runtime/RuntimeTimeline.tsx";

export function DashboardPage() {
    const { metrics, activities, history } = useRuntime();

    const runtimeDashboardMetrics = [
        {
            label: "Events received",
            value: metrics.eventsReceived,
            description: "Total events accepted by OB1",
            status: "healthy" as const,
        },
        {
            label: "Delivered",
            value: metrics.delivered,
            description: "Successful downstream deliveries",
            status: "healthy" as const,
        },
        {
            label: "Observations",
            value: metrics.observations,
            description: "Analytical observations produced",
            status: "neutral" as const,
        },
        {
            label: "Retries",
            value: metrics.retries,
            description: "Delivery retries scheduled",
            status: "neutral" as const,
        },
        {
            label: "Dead Letters",
            value: metrics.deadLetters,
            description: "Events moved to dead-letter queue",
            status: "critical" as const,
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-black text-slate-100">
                    Event Intelligence Dashboard
                </h2>

                <p className="mt-2 text-slate-400">
                    Real-time supervision of routing, analytics and processing chains.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
                {runtimeDashboardMetrics.map((metric) => (
                    <MetricCard
                        key={metric.label}
                        metric={metric}
                    />
                ))}
            </div>

            <RuntimeMetricsChart data={history} />

            <RuntimeTimeline activities={activities} />
        </div>
    );
}