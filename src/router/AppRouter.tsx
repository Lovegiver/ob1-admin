import { BrowserRouter, Route, Routes } from "react-router-dom";

import { AppLayout } from "../components/layout/AppLayout";

import { DashboardPage } from "../pages/DashboardPage";
import { EventTypesPage } from "../pages/EventTypesPage";
import { MetricsPage } from "../pages/MetricsPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { ProcessingPage } from "@/pages/ProcessingPage.tsx";
import { RuntimeProvider } from "@/context/RuntimeContext.tsx";
import { LoginPage } from "@/pages/LoginPage";
import { ForbiddenPage } from "@/pages/ForbiddenPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { RequireAuth } from "@/router/RequireAuth";
import { HttpErrorNavigation } from "@/router/HttpErrorNavigation";

function AuthenticatedApplication() {
    return (
        <RequireAuth>
            <RuntimeProvider>
                <AppLayout />
            </RuntimeProvider>
        </RequireAuth>
    );
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <HttpErrorNavigation />
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<AuthenticatedApplication />}>
                    <Route index element={<DashboardPage />} />

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

                    <Route path="/processing" element={<ProcessingPage />} />
                    <Route path="/forbidden" element={<ForbiddenPage />} />
                </Route>
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
    );
}
