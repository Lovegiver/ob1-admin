import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { SessionLoadingPage } from "@/pages/SessionLoadingPage";

interface RequireAuthProps {
    children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
    const { status } = useAuth();
    const location = useLocation();

    if (status === "RESTORING" || status === "AUTHENTICATING") {
        return <SessionLoadingPage />;
    }

    if (status === "ANONYMOUS") {
        const requestedPath = `${location.pathname}${location.search}${location.hash}`;
        return <Navigate to="/login" replace state={{ from: requestedPath }} />;
    }

    return children;
}
