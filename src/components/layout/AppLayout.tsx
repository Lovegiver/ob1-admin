import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
    children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_32rem)]" />

            <div className="relative flex min-h-screen">
                <Sidebar />

                <main className="flex min-w-0 flex-1 flex-col">
                    <Topbar />
                    <section className="flex-1 p-6">{children}</section>
                </main>
            </div>
        </div>
    );
}