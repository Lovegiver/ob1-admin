import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card.tsx";

import { Badge } from "@/components/ui/badge.tsx";

import { Separator } from "@/components/ui/separator.tsx";

export interface RuntimeActivity {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    severity: "info" | "success" | "warning" | "error";
}

interface ActivityFeedProps {
    activities: RuntimeActivity[];
}

const severityVariants: Record<string, string> = {
    info: "bg-cyan-500/15 text-cyan-300 border-cyan-400/20",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    warning: "bg-amber-500/15 text-amber-300 border-amber-400/20",
    error: "bg-red-500/15 text-red-300 border-red-400/20",
};

export function ActivityFeed({
                                 activities,
                             }: ActivityFeedProps) {
    return (
        <Card className="border-cyan-400/10 bg-slate-950/60 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-slate-100">
                    Runtime Activity
                </CardTitle>

                <Badge
                    variant="outline"
                    className="border-cyan-400/20 bg-cyan-500/10 text-cyan-300"
                >
                    LIVE
                </Badge>
            </CardHeader>

            <CardContent className="space-y-4">
                {activities.map((activity, index) => (
                    <div key={activity.id}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="font-medium text-slate-100">
                                    {activity.title}
                                </div>

                                <div className="mt-1 text-sm text-slate-400">
                                    {activity.description}
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                <Badge
                                    variant="outline"
                                    className={severityVariants[activity.severity]}
                                >
                                    {activity.severity}
                                </Badge>

                                <span className="text-xs text-slate-500">
                  {activity.timestamp}
                </span>
                            </div>
                        </div>

                        {index < activities.length - 1 && (
                            <Separator className="mt-4 bg-cyan-400/10" />
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}