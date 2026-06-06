import { useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

interface RuntimeMetricsPoint {
    timestamp: string;
    eventsReceived: number;
    delivered: number;
    observations: number;
    retries: number;
    deadLetters: number;
}

interface RuntimeMetricsChartProps {
    data: RuntimeMetricsPoint[];
}

export function RuntimeMetricsChart({
                                        data,
                                    }: RuntimeMetricsChartProps) {

    const [visibleSeries, setVisibleSeries] = useState({
        eventsReceived: true,
        delivered: true,
        retries: true,
        deadLetters: true,
    });

    function toggleSeries(
        seriesKey: keyof typeof visibleSeries,
    ) {
        setVisibleSeries((previousState) => ({
            ...previousState,
            [seriesKey]: !previousState[seriesKey],
        }));
    }

    return (
        <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/60 p-6 backdrop-blur">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-100">
                    Runtime Throughput
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                    Live websocket metrics stream.
                </p>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <button
                    onClick={() => toggleSeries("eventsReceived")}
                    className={
                        visibleSeries.eventsReceived
                            ? "rounded border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300"
                            : "rounded border border-slate-700 bg-slate-900/40 px-3 py-1 text-sm text-slate-500"
                    }
                >
                    Events
                </button>

                <button
                    onClick={() => toggleSeries("delivered")}
                    className={
                        visibleSeries.delivered
                            ? "rounded border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300"
                            : "rounded border border-slate-700 bg-slate-900/40 px-3 py-1 text-sm text-slate-500"
                    }
                >
                    Delivered
                </button>

                <button
                    onClick={() => toggleSeries("retries")}
                    className={
                        visibleSeries.retries
                            ? "rounded border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-sm text-amber-300"
                            : "rounded border border-slate-700 bg-slate-900/40 px-3 py-1 text-sm text-slate-500"
                    }
                >
                    Retries
                </button>

                <button
                    onClick={() => toggleSeries("deadLetters")}
                    className={
                        visibleSeries.deadLetters
                            ? "rounded border border-red-400/20 bg-red-500/10 px-3 py-1 text-sm text-red-300"
                            : "rounded border border-slate-700 bg-slate-900/40 px-3 py-1 text-sm text-slate-500"
                    }
                >
                    Dead Letters
                </button>
            </div>

            <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient
                                id="eventsGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#22d3ee"
                                    stopOpacity={0.4}
                                />

                                <stop
                                    offset="95%"
                                    stopColor="#22d3ee"
                                    stopOpacity={0}
                                />
                            </linearGradient>

                            <linearGradient
                                id="deliveryGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#10b981"
                                    stopOpacity={0.4}
                                />

                                <stop
                                    offset="95%"
                                    stopColor="#10b981"
                                    stopOpacity={0}
                                />
                            </linearGradient>

                            <linearGradient id="retriesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>

                            <linearGradient id="deadLettersGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>

                        </defs>

                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#334155"
                        />

                        <XAxis
                            dataKey="timestamp"
                            stroke="#94a3b8"
                        />

                        <YAxis stroke="#94a3b8" />

                        <Tooltip />

                        <Legend />

                        {data.map((point, index) => {
                            const hasVisibleDeadLetter =
                                visibleSeries.deadLetters && point.deadLetters > 0;

                            const hasVisibleRetry =
                                visibleSeries.retries && point.retries > 0;

                            const hasIncident =
                                hasVisibleDeadLetter || hasVisibleRetry;

                            if (!hasIncident) {
                                return null;
                            }

                            return (
                                <ReferenceLine
                                    key={`incident-${index}`}
                                    x={point.timestamp}
                                    stroke={
                                        hasVisibleDeadLetter
                                            ? "#ef4444"
                                            : "#f59e0b"
                                    }
                                    strokeDasharray="4 4"
                                />
                            );
                        })}

                        {visibleSeries.eventsReceived && (
                            <Area
                                type="monotone"
                                name="Events received"
                                dataKey="eventsReceived"
                                stroke="#22d3ee"
                                fill="url(#eventsGradient)"
                                strokeWidth={2}
                            />
                        )}

                        {visibleSeries.delivered && (
                            <Area
                                type="monotone"
                                name="Events delivered"
                                dataKey="delivered"
                                stroke="#10b981"
                                fill="url(#deliveryGradient)"
                                strokeWidth={2}
                            />
                        )}

                        {visibleSeries.retries && (
                            <Area
                                type="monotone"
                                name="Retries"
                                dataKey="retries"
                                stroke="#f59e0b"
                                fill="url(#retriesGradient)"
                                strokeWidth={2}
                            />
                        )}

                        {visibleSeries.deadLetters && (
                            <Area
                                type="monotone"
                                name="Dead letters"
                                dataKey="deadLetters"
                                stroke="#ef4444"
                                fill="url(#deadLettersGradient)"
                                strokeWidth={2}
                            />
                        )}

                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}