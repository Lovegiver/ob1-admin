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

import type {
    RuntimeMetricsHistoryPoint,
} from "@/context/runtimeContextDefinition.ts";

interface RuntimeMetricsChartProps {
    data: RuntimeMetricsHistoryPoint[];
}

export function RuntimeMetricsChart({
                                        data,
                                    }: RuntimeMetricsChartProps) {

    const [visibleSeries, setVisibleSeries] = useState({
        eventsRouted: true,
        deliveriesSucceeded: true,
        deliveriesFailed: true,
        deadLetters: true,

        eventsReceived: false,
        eventsCompleted: false,
        eventsUnroutable: false,
        eventsFailed: false,
        retries: false,
        observations: false,
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
                    Live pipeline activity from OB1 runtime events.
                </p>

            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                {Object.entries({
                    eventsRouted: "Events routed",
                    deliveriesSucceeded: "Deliveries OK",
                    deliveriesFailed: "Deliveries failed",
                    deadLetters: "Dead letters",
                    eventsReceived: "Events received",
                    eventsCompleted: "Events completed",
                    eventsUnroutable: "Events unroutable",
                    eventsFailed: "Events failed",
                    retries: "Retries",
                    observations: "Observations",
                }).map(([key, label]) => {
                    const seriesKey = key as keyof typeof visibleSeries;

                    return (
                        <button
                            key={key}
                            onClick={() => toggleSeries(seriesKey)}
                            className={
                                visibleSeries[seriesKey]
                                    ? "rounded border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300"
                                    : "rounded border border-slate-700 bg-slate-900/40 px-3 py-1 text-sm text-slate-500"
                            }
                        >
                            {label}
                        </button>
                    );
                })}
            </div>

            <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#334155"
                        />

                        <XAxis
                            dataKey="timestamp"
                            type="number"
                            domain={[
                                () => Date.now() - 60_000,
                                () => Date.now(),
                            ]}
                            tickFormatter={(value) =>
                                new Date(value).toLocaleTimeString()
                            }
                            stroke="#94a3b8"
                            interval="preserveStartEnd"
                            minTickGap={48}
                        />

                        <YAxis
                            stroke="#94a3b8"
                            allowDecimals={false}
                        />

                        <Tooltip
                            labelFormatter={(value) =>
                                new Date(Number(value)).toLocaleTimeString()
                            }
                        />

                        <Legend />

                        {data.map((point, index) => {
                            const hasVisibleDeadLetter =
                                visibleSeries.deadLetters && point.deadLetters > 0;

                            const hasVisibleFailure =
                                visibleSeries.deliveriesFailed &&
                                point.deliveriesFailed > 0;

                            const hasIncident =
                                hasVisibleDeadLetter || hasVisibleFailure;

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

                        {visibleSeries.eventsRouted && (
                            <Area
                                type="monotone"
                                name="Events routed"
                                dataKey="eventsRouted"
                                stroke="#22d3ee"
                                fill="#22d3ee22"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.deliveriesSucceeded && (
                            <Area
                                type="monotone"
                                name="Deliveries OK"
                                dataKey="deliveriesSucceeded"
                                stroke="#10b981"
                                fill="#10b98122"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.deliveriesFailed && (
                            <Area
                                type="monotone"
                                name="Deliveries failed"
                                dataKey="deliveriesFailed"
                                stroke="#f59e0b"
                                fill="#f59e0b22"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.deadLetters && (
                            <Area
                                type="monotone"
                                name="Dead letters"
                                dataKey="deadLetters"
                                stroke="#ef4444"
                                fill="#ef444422"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.eventsReceived && (
                            <Area
                                type="monotone"
                                name="Events received"
                                dataKey="eventsReceived"
                                stroke="#38bdf8"
                                fill="#38bdf822"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.eventsCompleted && (
                            <Area
                                type="monotone"
                                name="Events completed"
                                dataKey="eventsCompleted"
                                stroke="#a78bfa"
                                fill="#a78bfa22"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.eventsUnroutable && (
                            <Area
                                type="monotone"
                                name="Events unroutable"
                                dataKey="eventsUnroutable"
                                stroke="#fb7185"
                                fill="#fb718522"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.eventsFailed && (
                            <Area
                                type="monotone"
                                name="Events failed"
                                dataKey="eventsFailed"
                                stroke="#dc2626"
                                fill="#dc262622"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.retries && (
                            <Area
                                type="monotone"
                                name="Retries"
                                dataKey="retries"
                                stroke="#facc15"
                                fill="#facc1522"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}

                        {visibleSeries.observations && (
                            <Area
                                type="monotone"
                                name="Observations"
                                dataKey="observations"
                                stroke="#14b8a6"
                                fill="#14b8a622"
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}