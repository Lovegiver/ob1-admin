import {
    Activity,
    BarChart3,
    Boxes,
    FolderKanban,
    Cpu
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigationItems = [
    {
        label: "Dashboard",
        path: "/",
        icon: BarChart3,
    },
    {
        label: "Projects",
        path: "/projects",
        icon: FolderKanban,
    },
    {
        label: "Event Types",
        path: "/event-types",
        icon: Boxes,
    },
    {
        label: "Metrics",
        path: "/metrics",
        icon: Activity,
    },
    {
        label: "Processing",
        path: "/processing",
        icon: Cpu,
    },
];

export function Sidebar() {
    return (
        <aside className="w-72 border-r border-cyan-400/20 bg-slate-950/80 p-5 shadow-[0_0_40px_rgba(34,211,238,0.08)]">
            <div className="mb-10">
                <div className="text-3xl font-black tracking-wide text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">
                    OB1
                </div>

                <div className="mt-1 text-xs uppercase tracking-[0.35em] text-cyan-500/70">
                    Event Core
                </div>
            </div>

            <nav className="space-y-2">
                {navigationItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `
                              flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition
                              ${
                                    isActive
                                        ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
                                        : "border-cyan-400/10 text-slate-300 hover:border-cyan-300/30 hover:bg-cyan-400/10 hover:text-cyan-100"
                                }
                `
                            }
                        >
                            <Icon size={18} />

                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </aside>
    );
}