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

    function resolveProcessingPressureStatus(
        oldestReceivedAgeSeconds: number | null,
    ) {
        if (oldestReceivedAgeSeconds === null) {
            return "healthy" as const;
        }

        if (oldestReceivedAgeSeconds >= 300) {
            return "critical" as const;
        }

        if (oldestReceivedAgeSeconds >= 60) {
            return "warning" as const;
        }

        return "neutral" as const;
    }

    const runtimeDashboardMetrics = [
        {
            label: "Events total",
            value: metrics.eventsTotal,
            description: "Total events accepted by OB1",
            status: "healthy" as const,
        },
        {
            label: "Pending events",
            value: metrics.pendingEvents,
            description: "Events waiting for worker processing",
            status: metrics.pendingEvents > 0 ? "warning" as const : "healthy" as const,
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
            description: "Deliveries moved to dead-letter state",
            status: "critical" as const,
        },
        {
            label: "Pending deliveries",
            value: metrics.pendingDeliveries,
            description: "Deliveries waiting for worker execution",
            status: metrics.pendingDeliveries > 0 ? "warning" as const : "healthy" as const,
        },
        {
            label: "Oldest delivery lag",
            value: formatAge(metrics.oldestPendingDeliveryAgeSeconds),
            description: "Age of the oldest pending delivery",
            status: metrics.oldestPendingDeliveryAgeSeconds !== null ? "warning" as const : "healthy" as const,
        },
        {
            label: "Processing pressure",
            value: formatAge(metrics.oldestReceivedAgeSeconds),
            description: "Oldest event waiting for worker processing",
            status: resolveProcessingPressureStatus(
                metrics.oldestReceivedAgeSeconds,
            ),
        },
    ];

    const deliveryAttempts =
        metrics.deliveriesSucceeded +
        metrics.deliveriesFailed +
        metrics.deadLetters;

    const terminalDeliveries =
        metrics.deliveriesSucceeded +
        metrics.deadLetters;

    const deliveredLastMinute = history.reduce(
        (total, point) => total + point.deliveriesSucceeded,
        0,
    );

    const attemptedLastMinute = history.reduce(
        (total, point) =>
            total +
            point.deliveriesSucceeded +
            point.deliveriesFailed +
            point.deadLetters,
        0,
    );

    function formatRate(
        numerator: number,
        denominator: number,
    ): string {
        if (denominator === 0) {
            return "—";
        }

        return `${Math.round((numerator / denominator) * 100)}%`;
    }

    function formatAge(seconds: number | null): string {
        if (seconds === null) {
            return "—";
        }

        if (seconds < 60) {
            return `${seconds}s`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${minutes}m ${remainingSeconds}s`;
    }

    const deliveryOperationsMetrics = [
        {
            label: "Delivery success rate",
            value: formatRate(metrics.deliveriesSucceeded, terminalDeliveries),
            description: "Successful terminal deliveries versus dead letters",
            status: metrics.deadLetters > 0 ? "warning" as const : "healthy" as const,
        },
        {
            label: "Attempt success rate",
            value: formatRate(metrics.deliveriesSucceeded, deliveryAttempts),
            description: "Successful attempts versus failed attempts",
            status: metrics.deliveriesFailed > 0 ? "warning" as const : "healthy" as const,
        },
        {
            label: "Dead letter rate",
            value: formatRate(metrics.deadLetters, terminalDeliveries),
            description: "Terminal failures among completed deliveries",
            status: metrics.deadLetters > 0 ? "critical" as const : "healthy" as const,
        },
        {
            label: "Delivered / min",
            value: deliveredLastMinute,
            description: "Successful deliveries over the live chart window",
            status: "neutral" as const,
        },
        {
            label: "Attempts / min",
            value: attemptedLastMinute,
            description: "Delivery attempts over the live chart window",
            status: "neutral" as const,
        },
        {
            label: "Avg deliveries / event",
            value: metrics.eventsRouted === 0
                ? "—"
                : (metrics.deliveriesCreated / metrics.eventsRouted).toFixed(2),
            description: "Average downstream deliveries created per routed event",
            status: "neutral" as const,
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-bold text-slate-100">
                    Operational State
                    <span className="ml-3 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
                        PERSISTED
                    </span>
                </h3>

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
                                    ? new Date(workerHealth.lastHeartbeatAt).toLocaleTimeString()
                                    : "—"}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">
                                Last cycle started
                            </div>

                            <div className="mt-1 font-medium text-slate-100">
                                {workerHealth.lastStartedAt
                                    ? new Date(workerHealth.lastStartedAt).toLocaleTimeString()
                                    : "—"}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">
                                Last cycle finished
                            </div>

                            <div className="mt-1 font-medium text-slate-100">
                                {workerHealth.lastFinishedAt
                                    ? new Date(workerHealth.lastFinishedAt).toLocaleTimeString()
                                    : "—"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-slate-100">
                        Runtime Throughput
                        <span className="ml-3 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                            LIVE
                        </span>
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                        Delivery-centric ratios and throughput indicators.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-6">
                    {deliveryOperationsMetrics.map((metric) => (
                        <MetricCard
                            key={metric.label}
                            metric={metric}
                        />
                    ))}
                </div>
            </div>

            <RuntimeMetricsChart data={history} />

            <RuntimeTimeline activities={activities} />
        </div>
    );
}