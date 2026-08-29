import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { httpEvents } from "@/services/httpEvents";

export function HttpErrorNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => httpEvents.onForbidden(() => {
        if (location.pathname !== "/forbidden") {
            navigate("/forbidden", {
                replace: true,
                state: { from: location.pathname },
            });
        }
    }), [location.pathname, navigate]);

    return null;
}
