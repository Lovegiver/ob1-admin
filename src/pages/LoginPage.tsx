import { useEffect, useRef, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { safeReturnPath } from "@/router/safeReturnPath";

interface LoginLocationState {
    from?: unknown;
}

export function LoginPage() {
    const { status, error, login, clearError } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const submittingRef = useRef(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const destination = safeReturnPath(
        (location.state as LoginLocationState | null)?.from,
    );

    useEffect(() => clearError, [clearError]);

    if (status === "AUTHENTICATED") {
        return <Navigate to={destination} replace />;
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (submittingRef.current) {
            return;
        }

        const form = new FormData(event.currentTarget);
        const email = String(form.get("email") ?? "").trim();
        const password = String(form.get("password") ?? "");

        if (!email || !password) {
            setValidationError("L’adresse e-mail et le mot de passe sont requis.");
            return;
        }

        submittingRef.current = true;
        setValidationError(null);
        clearError();

        try {
            await login({ email, password });
            navigate(destination, { replace: true });
        } catch {
            // Le provider expose déjà un message public et nettoie toute session partielle.
        } finally {
            submittingRef.current = false;
        }
    }

    const isSubmitting = status === "AUTHENTICATING";
    const message = validationError ?? error;

    return (
        <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
            <section className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-900/80 p-8 shadow-[0_0_50px_rgba(34,211,238,0.10)]">
                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">OB1</p>
                    <h1 className="mt-3 text-3xl font-bold">Connexion</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Accédez au cockpit d’administration avec votre compte Outbox.
                    </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Adresse e-mail</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {message && (
                        <p role="alert" className="text-sm text-red-300">
                            {message}
                        </p>
                    )}

                    <Button className="w-full" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Connexion…" : "Se connecter"}
                    </Button>
                </form>
            </section>
        </main>
    );
}
