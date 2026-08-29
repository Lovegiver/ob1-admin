import { YamlObservatory } from "@/services/YamlObservatory";

export function MetricsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-semibold tracking-tight">Metrics</h1>
                <p className="text-muted-foreground">
                    Define, validate, and preview YAML metric extraction plans.
                </p>
            </div>

            <YamlObservatory />
        </div>
    );
}