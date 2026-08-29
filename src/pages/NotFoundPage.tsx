import { Link } from "react-router-dom";

export function NotFoundPage() {
    return (
        <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
            <section className="text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">HTTP 404</p>
                <h1 className="mt-3 text-3xl font-bold">Page introuvable</h1>
                <p className="mt-3 text-slate-400">La route demandée n’existe pas.</p>
                <Link className="mt-6 inline-block text-cyan-300 underline" to="/">Retour à l’application</Link>
            </section>
        </main>
    );
}
