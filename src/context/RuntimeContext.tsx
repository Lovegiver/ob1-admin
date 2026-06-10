import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

import {RuntimeContext, type WorkerHealth} from "@/context/runtimeContextDefinition.ts";

import type {
    RuntimeConnectionStatus,
    RuntimeMetrics,
    RuntimeMetricsHistoryPoint,
} from "@/context/runtimeContextDefinition.ts";

import {
    connectRuntimeEventStream,
} from "@/services/runtimeEventService.ts";

import type { RuntimeActivity } from "@/components/dashboard/ActivityFeed.tsx";

import {
    resolveRuntimeSeverity,
    isDeadLetterRetryRequested,
    isDeliveryDeadLettered,
    isDeliveryFailure,
    isDeliverySuccess,
    isEventCompleted,
    isEventFailed,
    isEventReceived,
    isEventRouted,
    isEventUnroutable,
    isInfrastructureEvent,
    isMetricsExtracted,
} from "@/components/runtime/runtimeEventMappers.ts";

import type { RuntimeEvent } from "@/components/runtime/RuntimeEvent.ts";
import {RuntimeEventType} from "@/components/runtime/RuntimeEventType.ts";


interface RuntimeProviderProps {
    children: ReactNode;
}


export function RuntimeProvider({
                                    children,
                                }: RuntimeProviderProps) {

    const [activities, setActivities] = useState<RuntimeActivity[]>([]);

    const [metrics, setMetrics] = useState<RuntimeMetrics>({
        eventsReceived: 0,

        eventsRouted: 0,
        eventsCompleted: 0,
        eventsUnroutable: 0,
        eventsFailed: 0,

        deliveriesSucceeded: 0,
        deliveriesFailed: 0,

        retries: 0,
        deadLetters: 0,

        observations: 0,
    });

    const [history, setHistory] = useState<RuntimeMetricsHistoryPoint[]>([]);

    const [connectionStatus, setConnectionStatus] =
        useState<RuntimeConnectionStatus>("disconnected");

    const [isTimelinePaused, setIsTimelinePaused] = useState(false);
    const currentBucketRef = useRef({
        eventsReceived: 0,

        eventsRouted: 0,
        eventsCompleted: 0,
        eventsUnroutable: 0,
        eventsFailed: 0,

        deliveriesSucceeded: 0,
        deliveriesFailed: 0,

        retries: 0,
        deadLetters: 0,

        observations: 0,
    });

    const [workerHealth, setWorkerHealth] = useState<WorkerHealth>({
        lastStartedAt: null,
        lastFinishedAt: null,
        lastHeartbeatAt: null,
        status: "unknown",
    });

    function toggleTimelinePaused() {
        setIsTimelinePaused((previousValue) => !previousValue);
    }

    useEffect(() => {

        return connectRuntimeEventStream({

            onMessage: (data: RuntimeEvent) => {

                if (isInfrastructureEvent(data)) {
                    setWorkerHealth((previousHealth) => ({
                        ...previousHealth,
                        lastStartedAt: data.type === RuntimeEventType.WorkerCycleStarted
                            ? data.timestamp
                            : previousHealth.lastStartedAt,
                        lastFinishedAt: data.type === RuntimeEventType.WorkerCycleFinished
                            ? data.timestamp
                            : previousHealth.lastFinishedAt,
                        lastHeartbeatAt: data.timestamp,
                        status: "healthy",
                    }));

                    return;
                }

                const runtimeActivity: RuntimeActivity = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toLocaleTimeString(),
                    title: data.type,
                    description: data.message ?? "",
                    severity: resolveRuntimeSeverity(data),
                };

                setMetrics((previousMetrics) => {

                    const updatedMetrics = {
                        ...previousMetrics,
                    };

                    if (isEventReceived(data)) {
                        updatedMetrics.eventsReceived += 1;
                    }

                    if (isEventRouted(data)) {
                        updatedMetrics.eventsRouted += 1;
                    }

                    if (isEventCompleted(data)) {
                        updatedMetrics.eventsCompleted += 1;
                    }

                    if (isEventUnroutable(data)) {
                        updatedMetrics.eventsUnroutable += 1;
                    }

                    if (isEventFailed(data)) {
                        updatedMetrics.eventsFailed += 1;
                    }

                    if (isDeliverySuccess(data)) {
                        updatedMetrics.deliveriesSucceeded += 1;
                    }

                    if (isDeliveryFailure(data)) {
                        updatedMetrics.deliveriesFailed += 1;
                    }

                    if (isDeadLetterRetryRequested(data)) {
                        updatedMetrics.retries += 1;
                    }

                    if (isDeliveryDeadLettered(data)) {
                        updatedMetrics.deadLetters += 1;
                    }

                    if (isMetricsExtracted(data)) {

                        const observationCount = Number(
                            data.payload?.observation_count ?? 0,
                        );

                        updatedMetrics.observations += observationCount;
                    }

                    return updatedMetrics;
                });

                if (isEventReceived(data)) {
                    currentBucketRef.current.eventsReceived += 1;
                }

                if (isEventRouted(data)) {
                    currentBucketRef.current.eventsRouted += 1;
                }

                if (isEventCompleted(data)) {
                    currentBucketRef.current.eventsCompleted += 1;
                }

                if (isEventUnroutable(data)) {
                    currentBucketRef.current.eventsUnroutable += 1;
                }

                if (isEventFailed(data)) {
                    currentBucketRef.current.eventsFailed += 1;
                }

                if (isDeliverySuccess(data)) {
                    currentBucketRef.current.deliveriesSucceeded += 1;
                }

                if (isDeliveryFailure(data)) {
                    currentBucketRef.current.deliveriesFailed += 1;
                }

                if (isDeadLetterRetryRequested(data)) {
                    currentBucketRef.current.retries += 1;
                }

                if (isDeliveryDeadLettered(data)) {
                    currentBucketRef.current.deadLetters += 1;
                }

                if (isMetricsExtracted(data)) {

                    const observationCount = Number(
                        data.payload?.observation_count ?? 0,
                    );

                    currentBucketRef.current.observations += observationCount;
                }

                setActivities((previousActivities) => {

                    if (isTimelinePaused) {
                        return previousActivities;
                    }

                    return [
                        runtimeActivity,
                        ...previousActivities,
                    ].slice(0, 50);
                });
            },

            onOpen: () => {
                setConnectionStatus("connected");
            },

            onClose: () => {
                setConnectionStatus("disconnected");
            },

            reconnectDelayMs: 3000,
        });

    }, [isTimelinePaused]);

    useEffect(() => {

        const intervalId = window.setInterval(() => {

            setHistory((previousHistory) => {

                const bucket = currentBucketRef.current;

                const nextPoint: RuntimeMetricsHistoryPoint = {
                    timestamp: Date.now(),

                    eventsReceived: bucket.eventsReceived,

                    eventsRouted: bucket.eventsRouted,
                    eventsCompleted: bucket.eventsCompleted,
                    eventsUnroutable: bucket.eventsUnroutable,
                    eventsFailed: bucket.eventsFailed,

                    deliveriesSucceeded: bucket.deliveriesSucceeded,
                    deliveriesFailed: bucket.deliveriesFailed,

                    retries: bucket.retries,
                    deadLetters: bucket.deadLetters,

                    observations: bucket.observations,
                };

                currentBucketRef.current = {
                    eventsReceived: 0,

                    eventsRouted: 0,
                    eventsCompleted: 0,
                    eventsUnroutable: 0,
                    eventsFailed: 0,

                    deliveriesSucceeded: 0,
                    deliveriesFailed: 0,

                    retries: 0,
                    deadLetters: 0,

                    observations: 0,
                };

                return [
                    ...previousHistory,
                    nextPoint,
                ].slice(-60);
            });

        }, 1000);

        return () => {
            window.clearInterval(intervalId);
        };

    }, []);

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setWorkerHealth((previousHealth) => {
                if (!previousHealth.lastHeartbeatAt) {
                    return previousHealth;
                }

                const heartbeatAgeMs =
                    Date.now() - new Date(previousHealth.lastHeartbeatAt).getTime();

                return {
                    ...previousHealth,
                    status: heartbeatAgeMs > 30_000 ? "stale" : "healthy",
                };
            });
        }, 5000);

        return () => window.clearInterval(intervalId);
    }, [workerHealth]);

    return (
        <RuntimeContext.Provider
            value={{
                metrics,
                activities,
                connectionStatus,
                history,
                isTimelinePaused,
                toggleTimelinePaused,
            }}
        >
            {children}
        </RuntimeContext.Provider>
    );
}