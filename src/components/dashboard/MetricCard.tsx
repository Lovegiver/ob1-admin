import type { DashboardMetric } from "@/types/dashboard.ts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
    metric: DashboardMetric;
}

const statusVariants: Record<string, string> = {
    healthy: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    warning: "bg-amber-500/15 text-amber-300 border-amber-400/20",
    critical: "bg-red-500/15 text-red-300 border-red-400/20",
    neutral: "bg-cyan-500/15 text-cyan-300 border-cyan-400/20",
};

export function MetricCard({ metric }: MetricCardProps) {
    return (
        <Card className="border-cyan-400/10 bg-slate-950/60 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.12)]">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                    <CardDescription className="uppercase tracking-widest text-slate-400">
                        {metric.label}
                    </CardDescription>

                    <CardTitle className="mt-4 text-5xl font-black text-slate-100">
                        {metric.value.toLocaleString()}
                    </CardTitle>
                </div>

                <Badge
                    className={statusVariants[metric.status]}
                    variant="outline"
                >
                    {metric.status}
                </Badge>
            </CardHeader>

            <CardContent>
                <p className="text-sm text-slate-400">
                    {metric.description}
                </p>
            </CardContent>
        </Card>
    );
}