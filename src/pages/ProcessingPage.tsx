import { useRuntime } from "@/context/useRuntime.ts";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet.tsx";
import { toast } from "sonner";

import type { ProcessingChain } from "@/data/mockDashboard.ts";
import { fetchProcessingChains } from "@/services/processingChainService.ts";

type ChainStatusFilter = "all" | "active" | "draft";

export function ProcessingPage() {
    const [statusFilter, setStatusFilter] = useState<ChainStatusFilter>("all");
    const [processingChains, setProcessingChains] = useState<ProcessingChain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedChain, setSelectedChain] = useState<ProcessingChain | null>(null);
    const { metrics } = useRuntime();

    useEffect(() => {
        const websocket = new WebSocket(
            "ws://127.0.0.1:8000/ws/runtime",
        );

        websocket.onopen = () => {
            console.log("OB1 runtime websocket connected");
        };

        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            toast.info("Runtime Event", {
                description: data.message,
            });
        };

        websocket.onclose = () => {
            console.log("OB1 runtime websocket disconnected");
        };

        return () => {
            websocket.close();
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadProcessingChains() {
            const chains = await fetchProcessingChains();

            if (isMounted) {
                setProcessingChains(chains);
                setIsLoading(false);
            }
        }

        void loadProcessingChains();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredProcessingChains = processingChains.filter((chain) => {
        if (statusFilter === "all") {
            return true;
        }

        return chain.status === statusFilter;
    });

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-400/20 border-t-cyan-300" />

                    <div className="text-sm uppercase tracking-[0.35em] text-cyan-400">
                        Loading Runtime Chains
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-black text-slate-100">
                    Processing Chains
                </h2>

                <p className="mt-2 text-slate-400">
                    Active analytical runtime chains, compatibility snapshots and executable processing plans.
                </p>
            </div>

            <div className="mt-6 flex gap-3">
                {(["all", "active", "draft"] as ChainStatusFilter[]).map((status) => (
                    <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={
                            statusFilter === status
                                ? "rounded-full border border-cyan-300/40 bg-cyan-500/15 px-4 py-2 text-sm text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                                : "rounded-full border border-cyan-400/10 px-4 py-2 text-sm text-slate-400 transition hover:border-cyan-300/30 hover:bg-cyan-500/10 hover:text-cyan-200"
                        }
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-slate-950/60 p-6 backdrop-blur">
                <div>
                    <div className="text-sm uppercase tracking-widest text-slate-500">
                        Events Received
                    </div>

                    <div className="mt-2 text-2xl font-black text-cyan-300">
                        {metrics.eventsTotal.toLocaleString()}
                    </div>
                </div>

                <div>
                    <div className="text-sm uppercase tracking-widest text-slate-500">
                        Deliveries
                    </div>

                    <div className="mt-2 text-2xl font-black text-emerald-300">
                        {metrics.deliveriesSucceeded.toLocaleString()}
                    </div>
                </div>

                <div>
                    <div className="text-sm uppercase tracking-widest text-slate-500">
                        Observations
                    </div>

                    <div className="mt-2 text-2xl font-black text-cyan-300">
                        {metrics.observations.toLocaleString()}
                    </div>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow className="border-cyan-400/10 hover:bg-transparent">
                            <TableHead>
                                Project
                                <div className="text-xs font-normal text-slate-500">
                                    Owner namespace
                                </div>
                            </TableHead>

                            <TableHead>
                                Event Type
                                <div className="text-xs font-normal text-slate-500">
                                    Incoming event contract
                                </div>
                            </TableHead>

                            <TableHead>
                                YAML
                                <div className="text-xs font-normal text-slate-500">
                                    Metric definition version
                                </div>
                            </TableHead>

                            <TableHead>
                                JSON
                                <div className="text-xs font-normal text-slate-500">
                                    Compatible schema version
                                </div>
                            </TableHead>

                            <TableHead>
                                Plans
                                <div className="text-xs font-normal text-slate-500">
                                    Executable units
                                </div>
                            </TableHead>

                            <TableHead>
                                Observations
                                <div className="text-xs font-normal text-slate-500">
                                    Produced analytics
                                </div>
                            </TableHead>

                            <TableHead>
                                Status
                                <div className="text-xs font-normal text-slate-500">
                                    Runtime state
                                </div>
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {filteredProcessingChains.map((chain) => (
                            <TableRow
                                key={chain.id}
                                className="cursor-pointer border-cyan-400/10 transition hover:bg-cyan-400/5"
                                onClick={() => {
                                    setSelectedChain(chain);

                                    toast.success("Processing chain selected", {
                                        description: `${chain.eventType} runtime details opened.`,
                                    });
                                }}
                            >
                                <TableCell className="font-medium text-slate-100">
                                    {chain.project}
                                </TableCell>

                                <TableCell className="text-slate-300">
                                    {chain.eventType}
                                </TableCell>

                                <TableCell className="text-cyan-300">
                                    v{chain.yamlVersion}
                                </TableCell>

                                <TableCell className="text-cyan-300">
                                    v{chain.jsonVersion}
                                </TableCell>

                                <TableCell>{chain.plans}</TableCell>

                                <TableCell>{chain.observations.toLocaleString()}</TableCell>

                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={
                                            chain.status === "active"
                                                ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                                                : "border-amber-400/20 bg-amber-500/15 text-amber-300"
                                        }
                                    >
                                        {chain.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <Sheet
                open={selectedChain !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedChain(null);
                    }
                }}
            >
                <SheetContent side="right" className="border-cyan-400/20 bg-slate-950 text-slate-100 sm:max-w-xl">
                    {selectedChain && (
                        <div className="space-y-8">
                            <SheetHeader>
                                <SheetTitle className="text-cyan-300">
                                    {selectedChain.eventType}
                                </SheetTitle>

                                <SheetDescription className="text-slate-400">
                                    Runtime analytical processing chain details.
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500">
                                        Project
                                    </div>

                                    <div className="mt-2 text-lg font-semibold">
                                        {selectedChain.project}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500">
                                        Runtime Status
                                    </div>

                                    <div className="mt-2">
                                        <Badge
                                            variant="outline"
                                            className={
                                                selectedChain.status === "active"
                                                    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                                                    : "border-amber-400/20 bg-amber-500/15 text-amber-300"
                                            }
                                        >
                                            {selectedChain.status}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500">
                                        YAML Version
                                    </div>

                                    <div className="mt-2 text-lg font-semibold text-cyan-300">
                                        v{selectedChain.yamlVersion}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500">
                                        JSON Version
                                    </div>

                                    <div className="mt-2 text-lg font-semibold text-cyan-300">
                                        v{selectedChain.jsonVersion}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500">
                                        Processing Plans
                                    </div>

                                    <div className="mt-2 text-3xl font-black text-slate-100">
                                        {selectedChain.plans}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/5 p-4">
                                    <div className="text-xs uppercase tracking-widest text-slate-500">
                                        Observations
                                    </div>

                                    <div className="mt-2 text-3xl font-black text-slate-100">
                                        {selectedChain.observations.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-cyan-400/10 bg-slate-900/60 p-6">
                                <div className="text-sm uppercase tracking-widest text-cyan-400">
                                    Runtime Notes
                                </div>

                                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                                    This processing chain currently operates using a precompiled
                                    execution plan snapshot generated from the active metric
                                    definition and JSON schema compatibility matrix.
                                </p>
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setSelectedChain(null)}
                        className="mb-4 rounded border border-cyan-400/20 px-3 py-2 text-sm text-cyan-300"
                    >
                        Close
                    </button>
                </SheetContent>
            </Sheet>
        </div>
    );
}