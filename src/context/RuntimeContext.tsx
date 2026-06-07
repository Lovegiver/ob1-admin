import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { RuntimeContext } from "@/context/runtimeContextDefinition.ts";
import type {
    RuntimeConnectionStatus,
    RuntimeMetrics,
    RuntimeMetricsHistoryPoint,
} from "@/context/runtimeContextDefinition.ts";
import {
    connectRuntimeEventStream,
    type RuntimeEventMessage,
} from "@/services/runtimeEventService.ts";
import type { RuntimeActivity } from "@/components/dashboard/ActivityFeed.tsx";



interface RuntimeProviderProps {
    children: ReactNode;
}


export function RuntimeProvider({ children, }: RuntimeProviderProps){

    const [activities, setActivities] = useState<RuntimeActivity[]>([]);

    const [metrics, setMetrics] = useState<RuntimeMetrics>({
        eventsReceived: 0,
        delivered: 0,
        observations: 0,
        retries: 0,
        deadLetters: 0,
    });

    const [history, setHistory] = useState<RuntimeMetricsHistoryPoint[]>([]);

    const [connectionStatus, setConnectionStatus] =
        useState<RuntimeConnectionStatus>("disconnected");

    const [isTimelinePaused, setIsTimelinePaused] = useState(false);

    const currentBucketRef = useRef({
        eventsReceived: 0,
        delivered: 0,
        observations: 0,
        retries: 0,
        deadLetters: 0,
    });

    function resolveRuntimeSeverity(
        eventType: string,
    ): RuntimeActivity["severity"] {
        if (
            eventType === "delivery.succeeded" ||
            eventType === "processing_chain.active"
        ) {
            return "success";
        }

        if (eventType === "delivery.retry") {
            return "warning";
        }

        if (eventType === "dead_letter.created") {
            return "error";
        }

        return "info";
    }

    function toggleTimelinePaused() {
        setIsTimelinePaused((previousValue) => !previousValue);
    }

    useEffect(() => {
        return connectRuntimeEventStream({
            onMessage: (data: RuntimeEventMessage) => {

                setMetrics((previousMetrics) => {
                    const updatedMetrics = {
                        ...previousMetrics,
                    };

                    if (data.type === "event.received") {
                        updatedMetrics.eventsReceived += 1;
                    }

                    if (data.type === "delivery.succeeded") {
                        updatedMetrics.delivered += 1;
                    }

                    if (data.type === "observation.created") {
                        updatedMetrics.observations += 1;
                    }

                    if (data.type === "delivery.retry") {
                        updatedMetrics.retries += 1;
                    }

                    if (data.type === "dead_letter.created") {
                        updatedMetrics.deadLetters += 1;
                    }

                    return updatedMetrics;
                });

                if (data.type === "event.received") {
                    currentBucketRef.current.eventsReceived += 1;
                }

                if (data.type === "delivery.succeeded") {
                    currentBucketRef.current.delivered += 1;
                }

                if (data.type === "observation.created") {
                    currentBucketRef.current.observations += 1;
                }

                if (data.type === "delivery.retry") {
                    currentBucketRef.current.retries += 1;
                }

                if (data.type === "dead_letter.created") {
                    currentBucketRef.current.deadLetters += 1;
                }

                const runtimeActivity: RuntimeActivity = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toLocaleTimeString(),
                    title: data.type,
                    description: data.message,
                    severity: resolveRuntimeSeverity(data.type),
                };

                setActivities((previousActivities) => {
                    if (isTimelinePaused) {
                        return previousActivities;
                    }

                    return [
                        runtimeActivity,
                        ...previousActivities,
                    ].slice(0, 10);
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

                const nextPoint = {
                    timestamp: Date.now(),
                    eventsReceived: bucket.eventsReceived,
                    delivered: bucket.delivered,
                    observations: bucket.observations,
                    retries: bucket.retries,
                    deadLetters: bucket.deadLetters,
                };

                currentBucketRef.current = {
                    eventsReceived: 0,
                    delivered: 0,
                    observations: 0,
                    retries: 0,
                    deadLetters: 0,
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