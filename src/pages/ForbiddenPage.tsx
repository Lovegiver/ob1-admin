import { Link, useLocation } from "react-router-dom";

import { safeReturnPath } from "@/router/safeReturnPath";

export function ForbiddenPage() {
    const location = useLocation();
    const from = safeReturnPath((location.state as { from?: unknown } | null)?.from);

    return (
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-400/20 bg-amber-400/5 p-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">HTTP 403</p>
            <h1 className="mt-3 text-2xl font-bold">Accès interdit</h1>
            <p className="mt-3 text-slate-300">
                Votre session reste active, mais votre compte n’est pas autorisé à accéder à cette ressource.
            </p>
            <Link className="mt-6 inline-block text-cyan-300 underline" to={from}>Revenir</Link>
        </div>
    );
}
