import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";

import { DashboardPage } from "../pages/DashboardPage";
import { EventTypesPage } from "../pages/EventTypesPage";
import { MetricsPage } from "../pages/MetricsPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProcessingPage } from "@/pages/ProcessingPage.tsx";

export function AppRouter() {
    return (
        <BrowserRouter>
            <AppLayout>
                <Routes>
                    <Route
                        path="/"
                        element={<DashboardPage />}
                    />

                    <Route
                        path="/projects"
                        element={<ProjectsPage />}
                    />

                    <Route
                        path="/event-types"
                        element={<EventTypesPage />}
                    />

                    <Route
                        path="/metrics"
                        element={<MetricsPage />}
                    />

                    <Route
                        path="/processing"
                        element={<ProcessingPage />}
                    />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
}