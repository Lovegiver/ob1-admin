import { useRuntime } from "@/context/useRuntime.ts";

export function Topbar() {

    const { connectionStatus } = useRuntime();

    return (
        <header className="flex h-20 items-center justify-between border-b border-cyan-400/20 bg-slate-950/70 px-6 backdrop-blur">
            <div>
                <h1 className="text-xl font-semibold text-slate-100">
                    Administration Cockpit
                </h1>
                <p className="text-sm text-slate-400">
                    Runtime supervision and event intelligence control.
                </p>
            </div>

            <div
                className={
                    connectionStatus === "connected"
                        ? "rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200 shadow-[0_0_24px_rgba(16,185,129,0.16)]"
                        : "rounded-full border border-red-300/30 bg-red-400/10 px-4 py-2 text-sm text-red-200 shadow-[0_0_24px_rgba(248,113,113,0.16)]"
                }
            >
                {connectionStatus === "connected" ? "CONNECTED" : "DISCONNECTED"}
            </div>
        </header>
    );
}