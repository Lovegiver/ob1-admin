import {
    CheckCircle2,
    Circle,
    RotateCw,
    XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import type { RuntimeActivity } from "@/components/dashboard/ActivityFeed.tsx";

interface TimelineEventProps {
    activity: RuntimeActivity;
    onSelect?: (activity: RuntimeActivity) => void;
    isLatest?: boolean;
}

function resolveIcon(
    severity: RuntimeActivity["severity"],
) {
    switch (severity) {
        case "success":
            return (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            );

        case "warning":
            return (
                <RotateCw className="h-5 w-5 text-amber-400" />
            );

        case "error":
            return (
                <XCircle className="h-5 w-5 text-red-400" />
            );

        default:
            return (
                <Circle className="h-5 w-5 text-cyan-400" />
            );
    }
}

export function TimelineEvent({
                                  activity,
                                  onSelect,
                                  isLatest = false,
                              }: TimelineEventProps) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 20,
                scale: 0.98,
            }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                boxShadow: isLatest
                    ? [
                        "0 0 0 rgba(34,211,238,0)",
                        "0 0 24px rgba(34,211,238,0.35)",
                        "0 0 0 rgba(34,211,238,0)",
                    ]
                    : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{
                duration: 0.6,
            }}
            onClick={() => onSelect?.(activity)}
            className="flex cursor-pointer gap-4 rounded-xl border border-transparent p-2 transition hover:border-cyan-400/20 hover:bg-slate-900/60"
        >
            <div className="mt-1">
                {resolveIcon(activity.severity)}
            </div>

            <div className="flex-1 border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                    <div className="font-medium text-slate-100">
                        {activity.title}
                    </div>

                    <div className="text-xs text-slate-500">
                        {activity.timestamp}
                    </div>
                </div>

                <div className="mt-1 text-sm text-slate-400">
                    {activity.description}
                </div>
            </div>
        </motion.div>
    );
}