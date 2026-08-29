import YAML from "yaml";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    listEventTypesByProject,
    listSchemasByEventType,
    type EventTypeRead,
    type SchemaDefinitionRead,
} from "@/services/adminCatalogService";
import {
    previewMetricYaml,
    validateMetricYaml,
    type MetricYamlPreviewResponse,
    type MetricYamlValidationResponse,
} from "@/services/yamlObservatoryService";


type FlattenedSchemaField = {
    path: string;
    jsonType: string;
    required: boolean;
    itemType?: string;
    format?: string;
};

function flattenJsonSchema(
    schema: Record<string, unknown>,
    basePath = "$",
): FlattenedSchemaField[] {
    const type = schema.type;
    const properties = schema.properties;
    const required = Array.isArray(schema.required)
        ? schema.required.filter((item): item is string => typeof item === "string")
        : [];

    if (type !== "object" || typeof properties !== "object" || properties === null) {
        return [];
    }

    return Object.entries(properties as Record<string, Record<string, unknown>>)
        .flatMap(([propertyName, propertySchema]) => {
            const path = `${basePath}.${propertyName}`;
            const jsonType = String(propertySchema.type ?? "unknown");
            const isRequired = required.includes(propertyName);
            const format =
                typeof propertySchema.format === "string"
                    ? propertySchema.format
                    : undefined;

            if (jsonType === "object") {
                return flattenJsonSchema(propertySchema, path);
            }

            if (jsonType === "array") {
                const items = propertySchema.items as Record<string, unknown> | undefined;
                const itemType = items?.type ? String(items.type) : "unknown";

                return [
                    {
                        path,
                        jsonType,
                        itemType,
                        required: isRequired,
                        format,
                    },
                ];
            }

            return [
                {
                    path,
                    jsonType,
                    required: isRequired,
                    format,
                },
            ];
        });
}

function getDisplayType(field: FlattenedSchemaField): string {
    if (field.jsonType === "string" && field.format === "date-time") {
        return "datetime";
    }

    if (field.jsonType === "array") {
        return `array[${field.itemType}]`;
    }

    return field.jsonType;
}

type TransformDefinition = {
    code: string;
    label: string;
    description: string;
};

type ObservationDraft = {
    id: string;
    field: FlattenedSchemaField;
    transform: TransformDefinition;
    metricCode: string;
    labels: ObservationLabelDraft[];
};

type ObservationLabelDraft = {
    id: string;
    name: string;
    field: FlattenedSchemaField;
};

function getObservationKey(
    field: FlattenedSchemaField,
    transformCode: string,
): string {
    return `${field.path}::${transformCode}`;
}

function buildMetricCode(
    field: FlattenedSchemaField,
    transform: TransformDefinition,
): string {
    const baseName = field.path
        .replace("$.", "")
        .replaceAll(".", "_");

    if (transform.code === "identity") {
        return baseName;
    }

    if (
        transform.code === "occurrence" ||
        transform.code === "occurrence_count"
    ) {
        return `${baseName}_total`;
    }

    return `${baseName}_${transform.code}`;
}

function getAvailableTransforms(
    field: FlattenedSchemaField,
): TransformDefinition[] {
    const displayType = getDisplayType(field);

    if (field.jsonType === "number" || field.jsonType === "integer") {
        return [
            {
                code: "identity",
                label: "Use numeric value",
                description: "Extract the numeric value as a metric.",
            },
        ];
    }

    if (displayType === "datetime") {
        return [
            {
                code: "timestamp",
                label: "Timestamp",
                description: "Convert the datetime to a Unix timestamp.",
            },
            {
                code: "hour_of_day",
                label: "Hour of day",
                description: "Extract the hour from 0 to 23.",
            },
            {
                code: "day_of_week",
                label: "Day of week",
                description: "Extract the weekday.",
            },
        ];
    }

    if (field.jsonType === "string") {
        return [
            {
                code: "length",
                label: "Text length",
                description: "Count the number of characters.",
            },
            {
                code: "occurrence",
                label: "Occurrence counter",
                description: "Count one occurrence grouped by this value.",
            },
        ];
    }

    if (field.jsonType === "boolean") {
        return [
            {
                code: "to_number",
                label: "Boolean as number",
                description: "Convert true to 1 and false to 0.",
            },
        ];
    }

    if (field.jsonType === "array" && field.itemType === "string") {
        return [
            {
                code: "count",
                label: "Item count",
                description: "Count the number of items.",
            },
            {
                code: "unique_count",
                label: "Unique item count",
                description: "Count distinct items.",
            },
            {
                code: "occurrence_count",
                label: "Item occurrence counter",
                description: "Count occurrences for each array item.",
            },
        ];
    }

    if (field.jsonType === "array" && field.itemType === "number") {
        return [
            {
                code: "count",
                label: "Item count",
                description: "Count the number of items.",
            },
            {
                code: "sum",
                label: "Sum",
                description: "Sum all numeric items.",
            },
            {
                code: "avg",
                label: "Average",
                description: "Compute the average numeric value.",
            },
            {
                code: "min",
                label: "Minimum",
                description: "Extract the minimum numeric value.",
            },
            {
                code: "max",
                label: "Maximum",
                description: "Extract the maximum numeric value.",
            },
        ];
    }

    return [];
}

function isCompatibleLabelField(field: FlattenedSchemaField): boolean {
    return (
        field.jsonType === "string" ||
        field.jsonType === "integer" ||
        field.jsonType === "boolean"
    );
}

function buildLabelName(field: FlattenedSchemaField): string {
    return field.path
        .replace("$.", "")
        .replaceAll(".", "_");
}

const PROMETHEUS_NAME_PATTERN = /^[a-zA-Z_:][a-zA-Z0-9_:]*$/;

function isValidPrometheusName(value: string): boolean {
    return PROMETHEUS_NAME_PATTERN.test(value);
}

export function YamlObservatory() {
    const [projectId, setProjectId] = useState<number>(1);

    const [eventTypes, setEventTypes] = useState<EventTypeRead[]>([]);
    const [selectedEventTypeId, setSelectedEventTypeId] = useState<number | null>(
        null,
    );

    const [schemas, setSchemas] = useState<SchemaDefinitionRead[]>([]);
    const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);

    const [validationResult, setValidationResult] =
        useState<MetricYamlValidationResponse | null>(null);

    const [previewResult, setPreviewResult] =
        useState<MetricYamlPreviewResponse | null>(null);

    const [loadingEventTypes, setLoadingEventTypes] = useState(false);
    const [loadingSchemas, setLoadingSchemas] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [technicalError, setTechnicalError] = useState<string | null>(null);

    const selectedSchema = useMemo(
        () => schemas.find((schema) => schema.id === selectedSchemaId) ?? null,
        [schemas, selectedSchemaId],
    );

    const flattenedSchemaFields = useMemo(
        () =>
            selectedSchema
                ? flattenJsonSchema(selectedSchema.json_schema).sort((a, b) => {
                    if (a.required !== b.required) {
                        return a.required ? -1 : 1;
                    }

                    return a.path.localeCompare(b.path);
                })
                : [],
        [selectedSchema],
    );
    const [selectedField, setSelectedField] =
        useState<FlattenedSchemaField | null>(null);

    const [observations, setObservations] = useState<ObservationDraft[]>(() => {
        return [];
    });

    const hasInvalidNames = useMemo(
        () =>
            observations.some(
                (observation) =>
                    !isValidPrometheusName(observation.metricCode) ||
                    observation.labels.some(
                        (label) => !isValidPrometheusName(label.name),
                    ),
            ),
        [observations],
    );

    useEffect(() => {
        async function loadEventTypes() {
            setLoadingEventTypes(true);
            setTechnicalError(null);
            setEventTypes([]);
            setSelectedEventTypeId(null);
            setSchemas([]);
            setSelectedSchemaId(null);

            try {
                const result = await listEventTypesByProject(projectId);
                setEventTypes(result);

                if (result.length > 0) {
                    setSelectedEventTypeId(result[0].id);
                }
            } catch (error) {
                setTechnicalError(
                    error instanceof Error
                        ? error.message
                        : "Unexpected error while loading event types",
                );
            } finally {
                setLoadingEventTypes(false);
            }
        }

        void loadEventTypes();
    }, [projectId]);

    useEffect(() => {
        async function loadSchemas() {
            if (selectedEventTypeId === null) {
                return;
            }

            setLoadingSchemas(true);
            setTechnicalError(null);
            setSchemas([]);
            setSelectedSchemaId(null);
            setValidationResult(null);
            setPreviewResult(null);

            try {
                const result = await listSchemasByEventType(selectedEventTypeId);
                setSchemas(result);

                if (result.length > 0) {
                    setSelectedSchemaId(result[0].id);
                }
            } catch (error) {
                setTechnicalError(
                    error instanceof Error
                        ? error.message
                        : "Unexpected error while loading schemas",
                );
            } finally {
                setLoadingSchemas(false);
            }
        }

        void loadSchemas();
    }, [selectedEventTypeId]);

    function addObservation(
        field: FlattenedSchemaField,
        transform: TransformDefinition,
    ): void {
        const observationKey = getObservationKey(field, transform.code);

        const alreadyExists = observations.some(
            (observation) =>
                getObservationKey(
                    observation.field,
                    observation.transform.code,
                ) === observationKey,
        );

        if (alreadyExists) {
            return;
        }

        const metricCode = buildMetricCode(field, transform);

        setObservations((current) => [
            ...current,
            {
                id: observationKey,
                field,
                transform,
                metricCode,
                labels: [],
            },
        ]);
    }

    function removeObservation(observationId: string): void {
        setObservations((current) =>
            current.filter((observation) => observation.id !== observationId),
        );
    }

    async function handleValidate() {
        if (selectedEventTypeId === null || selectedSchemaId === null) {
            setTechnicalError("Select an EventType and a JSON schema first.");
            return;
        }

        setLoadingAction(true);
        setTechnicalError(null);
        setPreviewResult(null);

        try {
            const result = await validateMetricYaml(selectedEventTypeId, {
                schema_definition_id: selectedSchemaId,
                yaml_content: generatedYaml,
            });

            setValidationResult(result);
        } catch (error) {
            setTechnicalError(
                error instanceof Error ? error.message : "Unexpected validation error",
            );
        } finally {
            setLoadingAction(false);
        }
    }

    async function handlePreview() {
        if (selectedEventTypeId === null || selectedSchemaId === null) {
            setTechnicalError("Select an EventType and a JSON schema first.");
            return;
        }

        setLoadingAction(true);
        setTechnicalError(null);

        try {
            const result = await previewMetricYaml(selectedEventTypeId, {
                schema_definition_id: selectedSchemaId,
                yaml_content: generatedYaml,
            });

            setPreviewResult(result);
            setValidationResult({
                valid: result.valid,
                errors: result.errors,
            });
        } catch (error) {
            setTechnicalError(
                error instanceof Error ? error.message : "Unexpected preview error",
            );
        } finally {
            setLoadingAction(false);
        }
    }

    function updateMetricCode(
        observationId: string,
        metricCode: string,
    ): void {
        setObservations((current) =>
            current.map((observation) =>
                observation.id === observationId
                    ? {
                        ...observation,
                        metricCode,
                    }
                    : observation,
            ),
        );
    }

    function addLabelToObservation(
        observationId: string,
        field: FlattenedSchemaField,
    ): void {
        setObservations((current) =>
            current.map((observation) => {
                if (observation.id !== observationId) {
                    return observation;
                }

                const alreadyExists = observation.labels.some(
                    (label) => label.field.path === field.path,
                );

                if (alreadyExists) {
                    return observation;
                }

                return {
                    ...observation,
                    labels: [
                        ...observation.labels,
                        {
                            id: `${observation.id}::label::${field.path}`,
                            name: buildLabelName(field),
                            field,
                        },
                    ],
                };
            }),
        );
    }

    function removeLabelFromObservation(
        observationId: string,
        labelId: string,
    ): void {
        setObservations((current) =>
            current.map((observation) =>
                observation.id === observationId
                    ? {
                        ...observation,
                        labels: observation.labels.filter(
                            (label) => label.id !== labelId,
                        ),
                    }
                    : observation,
            ),
        );
    }

    function updateLabelName(
        observationId: string,
        labelId: string,
        name: string,
    ): void {
        setObservations((current) =>
            current.map((observation) =>
                observation.id === observationId
                    ? {
                        ...observation,
                        labels: observation.labels.map((label) =>
                            label.id === labelId
                                ? {
                                    ...label,
                                    name,
                                }
                                : label,
                        ),
                    }
                    : observation,
            ),
        );
    }

    function buildYamlFromObservations(
        observations: ObservationDraft[],
    ): string {
        const yamlObject = {
            version: "1.0",
            observations: observations.map((observation) => ({
                code: observation.metricCode,
                value_path: observation.field.path,
                transform: observation.transform.code,
                labels: Object.fromEntries(
                    observation.labels.map((label) => [
                        label.name,
                        label.field.path,
                    ]),
                ),
            })),
        };

        return YAML.stringify(yamlObject);
    }

    const generatedYaml = useMemo(
        () => buildYamlFromObservations(observations),
        [observations],
    );

    const draftStorageKey = useMemo(
        () =>
            selectedEventTypeId !== null && selectedSchemaId !== null
                ? `ob1.metricsDraft.project.${projectId}.eventType.${selectedEventTypeId}.schema.${selectedSchemaId}`
                : null,
        [projectId, selectedEventTypeId, selectedSchemaId],
    );

    useEffect(() => {
        if (draftStorageKey === null) {
            return;
        }

        localStorage.setItem(
            draftStorageKey,
            JSON.stringify(observations),
        );
    }, [draftStorageKey, observations]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Scope</CardTitle>
                </CardHeader>

                <CardContent className="grid gap-4 md:grid-cols-3">
                    <label className="space-y-2 text-sm">
                        <span className="text-muted-foreground">Project ID</span>
                        <input
                            className="w-full rounded-md border bg-background px-3 py-2"
                            type="number"
                            value={projectId}
                            onChange={(event) => setProjectId(Number(event.target.value))}
                        />
                    </label>

                    <label className="space-y-2 text-sm">
                        <span className="text-muted-foreground">Event Type</span>
                        <select
                            className="w-full rounded-md border bg-background px-3 py-2"
                            value={selectedEventTypeId ?? ""}
                            disabled={loadingEventTypes || eventTypes.length === 0}
                            onChange={(event) =>
                                setSelectedEventTypeId(Number(event.target.value))
                            }
                        >
                            {eventTypes.length === 0 && (
                                <option value="">No EventType found</option>
                            )}

                            {eventTypes.map((eventType) => (
                                <option key={eventType.id} value={eventType.id}>
                                    {eventType.code} — {eventType.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-2 text-sm">
                        <span className="text-muted-foreground">Active JSON Schema</span>
                        <select
                            className="w-full rounded-md border bg-background px-3 py-2"
                            value={selectedSchemaId ?? ""}
                            disabled={loadingSchemas || schemas.length === 0}
                            onChange={(event) => setSelectedSchemaId(Number(event.target.value))}
                        >
                            {schemas.length === 0 && (
                                <option value="">No schema found</option>
                            )}

                            {schemas.map((schema) => (
                                <option key={schema.id} value={schema.id}>
                                    schema #{schema.id} — internal v{schema.json_version_internal}
                                </option>
                            ))}
                        </select>
                    </label>
                </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-[0.8fr_0.8fr_1.2fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Schema Fields</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Flattened schema fields</h3>
                            <span className="text-xs text-muted-foreground">
                                {flattenedSchemaFields.length} fields
                            </span>
                        </div>

                        {!selectedSchema && (
                            <p className="text-sm text-muted-foreground">
                                Select an EventType with an active JSON schema.
                            </p>
                        )}

                        {selectedSchema && (
                            <div className="space-y-2">
                                {flattenedSchemaFields.map((field) => (
                                    <button
                                        key={field.path}
                                        className={[
                                            "flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm hover:bg-muted",
                                            selectedField?.path === field.path ? "bg-muted" : "",
                                        ].join(" ")}
                                        type="button"
                                        onClick={() => setSelectedField(field)}
                                    >
                                        <span className="font-mono">{field.path}</span>

                                        <span className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                                {getDisplayType(field)}
                            </span>

                            <span
                                className={[
                                    "rounded-full border px-2 py-0.5 text-xs",
                                    field.required
                                        ? "border-blue-400/40 bg-blue-500/10 text-blue-300"
                                        : "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
                                ].join(" ")}
                            >
                                {field.required ? "required" : "optional"}
                            </span>
                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Observation Builder</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {!selectedField && (
                            <p className="text-sm text-muted-foreground">
                                Select a field from the schema.
                            </p>
                        )}

                        {selectedField && (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-xs text-muted-foreground">Path</div>
                                    <div className="font-mono text-sm">{selectedField.path}</div>
                                </div>

                                <div>
                                    <div className="text-xs text-muted-foreground">Type</div>
                                    <div className="text-sm">
                                        {getDisplayType(selectedField)}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs text-muted-foreground">Presence</div>
                                    <div className="text-sm">
                                        {selectedField.required ? "required" : "optional"}
                                    </div>
                                </div>

                                {technicalError && (
                                    <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                                        {technicalError}
                                    </div>
                                )}

                                {hasInvalidNames && (
                                    <p className="text-xs text-red-300">
                                        Fix invalid Prometheus metric or label names before validation.
                                    </p>
                                )}

                                <div className="border-t pt-4">
                                    <div className="mb-2 text-xs text-muted-foreground">
                                        Available transformations
                                    </div>

                                    <div className="space-y-2">
                                        {getAvailableTransforms(selectedField).length === 0 && (
                                            <p className="text-sm text-muted-foreground">
                                                No transform available for this field yet.
                                            </p>
                                        )}

                                        {getAvailableTransforms(selectedField).map((transform) => (
                                            <button
                                                key={transform.code}
                                                className="w-full rounded-md border px-3 py-2 text-left hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                                type="button"
                                                disabled={observations.some(
                                                    (observation) =>
                                                        getObservationKey(
                                                            observation.field,
                                                            observation.transform.code,
                                                        ) === getObservationKey(selectedField, transform.code),
                                                )}
                                                onClick={() => addObservation(selectedField, transform)}
                                            >
                                                <div className="text-sm font-medium">
                                                    {transform.label}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {transform.description}
                                                </div>
                                                {observations.some(
                                                    (observation) =>
                                                        getObservationKey(
                                                            observation.field,
                                                            observation.transform.code,
                                                        ) === getObservationKey(selectedField, transform.code),
                                                ) && (
                                                    <div className="mt-1 text-xs text-muted-foreground">
                                                        Already added
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Observations</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {observations.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                No observation defined yet.
                            </p>
                        )}

                        {observations.map((observation) => (
                            <div
                                key={observation.id}
                                className="rounded-md border p-3"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <input
                                            className="w-full rounded-md border px-3 py-2 text-sm"
                                            value={observation.metricCode}
                                            onChange={(event) =>
                                                updateMetricCode(
                                                    observation.id,
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        {!isValidPrometheusName(observation.metricCode) && (
                                            <p className="mt-1 text-xs text-red-300">
                                                Invalid Prometheus name. Use letters, digits, _, or :, and do not start with a digit.
                                            </p>
                                        )}

                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {observation.field.path} ·{" "}
                                            {getDisplayType(observation.field)} ·{" "}
                                            {observation.field.required ? "required" : "optional"} ·{" "}
                                            {observation.transform.code}
                                        </div>

                                        <div className="mt-3 space-y-2">
                                            <div className="text-xs text-muted-foreground">
                                                Labels
                                            </div>

                                            {observation.labels.length === 0 && (
                                                <p className="text-xs text-muted-foreground">
                                                    No label.
                                                </p>
                                            )}

                                            {observation.labels.map((label) => (
                                                <div
                                                    key={label.id}
                                                    className="flex items-center justify-between rounded-md border px-2 py-1 text-xs"
                                                >
                                                    <div className="flex flex-1 items-center gap-2">
                                                        <input
                                                            className="w-32 rounded-md border px-2 py-1 text-xs"
                                                            value={label.name}
                                                            onChange={(event) =>
                                                                updateLabelName(
                                                                    observation.id,
                                                                    label.id,
                                                                    event.target.value,
                                                                )
                                                            }
                                                        />
                                                        {!isValidPrometheusName(label.name) && (
                                                            <p className="mt-1 text-xs text-red-300">
                                                                Invalid label name.
                                                            </p>
                                                        )}

                                                        <span className="text-muted-foreground">
                                                            {label.field.path}
                                                        </span>
                                                    </div>

                                                    <Button
                                                        variant="secondary"
                                                        type="button"
                                                        onClick={() =>
                                                            removeLabelFromObservation(
                                                                observation.id,
                                                                label.id,
                                                            )
                                                        }
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                            <div className="mt-3 space-y-2">
                                                <div className="text-xs text-muted-foreground">
                                                    Add compatible label
                                                </div>

                                                <div className="flex flex-wrap gap-2">
                                                    {flattenedSchemaFields
                                                        .filter(isCompatibleLabelField)
                                                        .map((field) => {
                                                            const alreadyAdded = observation.labels.some(
                                                                (label) => label.field.path === field.path,
                                                            );

                                                            return (
                                                                <Button
                                                                    key={field.path}
                                                                    variant="secondary"
                                                                    type="button"
                                                                    disabled={alreadyAdded}
                                                                    onClick={() =>
                                                                        addLabelToObservation(
                                                                            observation.id,
                                                                            field,
                                                                        )
                                                                    }
                                                                >
                                                                    {buildLabelName(field)}
                                                                </Button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="secondary"
                                        type="button"
                                        onClick={() => removeObservation(observation.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {technicalError && (
                            <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                                {technicalError}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                disabled={loadingAction || hasInvalidNames || observations.length === 0}
                                onClick={handleValidate}
                            >
                                Validate
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                disabled={loadingAction || hasInvalidNames || observations.length === 0}
                                onClick={handlePreview}
                            >
                                Preview compiled plan
                            </Button>
                        </div>

                        {hasInvalidNames && (
                            <p className="text-xs text-red-300">
                                Fix invalid Prometheus metric or label names before validation.
                            </p>
                        )}

                        <div className="border-t pt-4">
                            <p className="mb-2 text-xs text-muted-foreground">
                                Generated YAML from current observations.
                            </p>
                        </div>
                        <pre className="max-h-[320px] overflow-auto rounded-md border bg-background p-3 text-xs">
                            {generatedYaml}
                        </pre>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Validation</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {!validationResult && (
                            <p className="text-sm text-muted-foreground">
                                No validation result yet.
                            </p>
                        )}

                        {validationResult && validationResult.valid && (
                            <p className="text-sm text-green-400">
                                YAML is valid against the selected JSON schema.
                            </p>
                        )}

                        {validationResult && !validationResult.valid && (
                            <div className="space-y-2">
                                <p className="text-sm text-red-300">YAML is invalid.</p>
                                <ul className="list-disc space-y-1 pl-5 text-sm text-red-300">
                                    {validationResult.errors.map((error) => (
                                        <li key={error}>{error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Compiled plan preview</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {!previewResult?.compiled_plan_json && (
                            <p className="text-sm text-muted-foreground">
                                No compiled plan preview yet.
                            </p>
                        )}

                        {previewResult?.compiled_plan_json && (
                            <pre className="max-h-[420px] overflow-auto rounded-md border bg-background p-3 text-xs">
                                {JSON.stringify(previewResult.compiled_plan_json, null, 2)}
                            </pre>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
