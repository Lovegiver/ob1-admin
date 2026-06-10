import { MetricCard } from "@/components/dashboard/MetricCard.tsx";
import { useRuntime } from "@/context/useRuntime.ts";
import { RuntimeMetricsChart } from "@/components/dashboard/RuntimeMetricsChart.tsx";
import { RuntimeTimeline } from "@/components/runtime/RuntimeTimeline.tsx";

export function DashboardPage() {

    const {
        metrics,
        activities,
        history,
        workerHealth,
    } = useRuntime();

    const runtimeDashboardMetrics = [
        {
            label: "Events received",
            value: metrics.eventsReceived,
            description: "Total events accepted by OB1",
            status: "healthy" as const,
        },
        {
            label: "Events routed",
            value: metrics.eventsRouted,
            description: "Events routed to downstream systems",
            status: "healthy" as const,
        },
        {
            label: "Events unroutable",
            value: metrics.eventsUnroutable,
            description: "Events with no active downstream route",
            status: "warning" as const,
        },
        {
            label: "Deliveries OK",
            value: metrics.deliveriesSucceeded,
            description: "Successful downstream deliveries",
            status: "healthy" as const,
        },
        {
            label: "Deliveries failed",
            value: metrics.deliveriesFailed,
            description: "Failed delivery attempts",
            status: "warning" as const,
        },
        {
            label: "Dead letters",
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

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">

                <div className="xl:col-span-10">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
                        {runtimeDashboardMetrics.map((metric) => (
                            <MetricCard
                                key={metric.label}
                                metric={metric}
                            />
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-2 rounded-2xl border border-cyan-400/10 bg-slate-950/60 p-4 backdrop-blur">

                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-100">
                            Worker Health
                        </h3>

                        <div
                            className={
                                workerHealth.status === "healthy"
                                    ? "h-3 w-3 rounded-full bg-emerald-400"
                                    : "h-3 w-3 rounded-full bg-red-500"
                            }
                        />
                    </div>

                    <div className="mt-6 space-y-4 text-sm">

                        <div>
                            <div className="text-slate-500">
                                Status
                            </div>

                            <div className="mt-1 font-medium text-slate-100">
                                {workerHealth.status}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">
                                Last heartbeat
                            </div>

                            <div className="mt-1 font-medium text-slate-100">
                                {workerHealth.lastHeartbeatAt
                                    ? new Date(
                                        workerHealth.lastHeartbeatAt,
                                    ).toLocaleTimeString()
                                    : "—"}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">
                                Last cycle started
                            </div>

                            <div className="mt-1 font-medium text-slate-100">
                                {workerHealth.lastStartedAt
                                    ? new Date(
                                        workerHealth.lastStartedAt,
                                    ).toLocaleTimeString()
                                    : "—"}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">
                                Last cycle finished
                            </div>

                            <div className="mt-1 font-medium text-slate-100">
                                {workerHealth.lastFinishedAt
                                    ? new Date(
                                        workerHealth.lastFinishedAt,
                                    ).toLocaleTimeString()
                                    : "—"}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <RuntimeMetricsChart data={history} />

            <RuntimeTimeline activities={activities} />
        </div>
    );
}