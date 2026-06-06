import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.tsx";
import type { RuntimeActivity } from "@/components/dashboard/ActivityFeed.tsx";
import { TimelineEvent } from "./TimelineEvent.tsx";
import { useRuntime } from "@/context/useRuntime.ts";

interface RuntimeTimelineProps {
    activities: RuntimeActivity[];
}

export function RuntimeTimeline({
                                    activities,
                                }: RuntimeTimelineProps) {

    const [selectedActivity, setSelectedActivity] =
        useState<RuntimeActivity | null>(null);

    const { isTimelinePaused, toggleTimelinePaused } = useRuntime();

    function resolveSeverityBadgeClass(
        severity: RuntimeActivity["severity"],
    ) {
        switch (severity) {
            case "success":
                return "border-emerald-400/30 bg-emerald-500/10 text-emerald-300";

            case "warning":
                return "border-amber-400/30 bg-amber-500/10 text-amber-300";

            case "error":
                return "border-red-400/30 bg-red-500/10 text-red-300";

            default:
                return "border-cyan-400/30 bg-cyan-500/10 text-cyan-300";
        }
    }

    return (
        <>
            <Card className="border-cyan-400/10 bg-slate-950/60 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-slate-100">
                        Runtime Timeline
                    </CardTitle>

                    <Badge
                        variant="outline"
                        className="border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
                    >
                        {activities.length} events
                        <button
                            type="button"
                            onClick={toggleTimelinePaused}
                            className={
                                isTimelinePaused
                                    ? "rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
                                    : "rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300"
                            }
                        >
                            {isTimelinePaused ? "RESUME" : "PAUSE"}
                        </button>
                    </Badge>
                </CardHeader>

                <CardContent>
                    {activities.length === 0 ? (
                        <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/40 p-8 text-center">
                            <div className="text-sm uppercase tracking-[0.3em] text-cyan-400">
                                Awaiting Runtime Signals
                            </div>

                            <p className="mt-4 text-sm text-slate-400">
                                OB1 is listening for live runtime events from the backend websocket.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {activities.map((activity, index) => (
                                <TimelineEvent
                                    key={activity.id}
                                    activity={activity}
                                    onSelect={setSelectedActivity}
                                    isLatest={index === 0}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Sheet
                open={selectedActivity !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedActivity(null);
                    }
                }}
            >
                <SheetContent
                    side="right"
                    className="border-cyan-400/20 bg-slate-950 text-slate-100 sm:max-w-xl"
                >
                    {selectedActivity && (
                        <div className="space-y-8">
                            <SheetHeader>
                                <SheetTitle className="text-cyan-300">
                                    {selectedActivity.title}
                                </SheetTitle>

                                <SheetDescription className="text-slate-400">
                                    Runtime event details.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500">
                                        Severity
                                    </div>

                                    <div className="mt-2">
                                        <Badge
                                            className={resolveSeverityBadgeClass(
                                                selectedActivity.severity,
                                            )}
                                        >
                                            {selectedActivity.severity}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500">
                                        Timestamp
                                    </div>

                                    <div className="mt-2 text-sm text-slate-200">
                                        {selectedActivity.timestamp}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                                <div className="text-sm uppercase tracking-widest text-cyan-400">
                                    Description
                                </div>

                                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                                    {selectedActivity.description}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                                <div className="text-sm uppercase tracking-widest text-cyan-400">
                                    Raw Runtime Event
                                </div>

                                <pre className="mt-4 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-cyan-100">
                        {JSON.stringify(selectedActivity, null, 2)}
                      </pre>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    );
}