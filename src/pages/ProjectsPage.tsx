import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@/auth/useAuth";
import { ConfirmationDialog } from "@/components/projects/ConfirmationDialog";
import { ProjectMembersPanel } from "@/components/projects/ProjectMembersPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateProjectDraft } from "@/project/projectValidation";
import { useProjects } from "@/project/useProjects";
import { ApiError } from "@/services/apiClient";
import { createProject, disableProject } from "@/services/projectService";

function errorMessage(caught: unknown, fallback: string): string {
    return caught instanceof ApiError ? caught.message : fallback;
}

export function ProjectsPage() {
    const { user } = useAuth();
    const { state, selectedProject, selectProject, refreshProjects } = useProjects();
    const { projectId: projectIdParam } = useParams();
    const navigate = useNavigate();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [confirmDisable, setConfirmDisable] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const createSubmission = useRef(false);

    const routeProjectId = projectIdParam === undefined ? null : Number(projectIdParam);
    const routeIdIsValid = routeProjectId === null || (Number.isSafeInteger(routeProjectId) && routeProjectId > 0);

    useEffect(() => {
        if (routeProjectId !== null && routeIdIsValid) selectProject(routeProjectId);
    }, [routeIdIsValid, routeProjectId, selectProject]);

    async function handleCreate(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (createSubmission.current) return;

        const form = event.currentTarget;
        const data = new FormData(form);
        const result = validateProjectDraft(String(data.get("project-name") ?? ""), String(data.get("project-description") ?? ""));
        if (!result.value) {
            setFormError(result.error ?? "Project invalide.");
            return;
        }

        createSubmission.current = true;
        setIsMutating(true);
        setFormError(null);
        setSuccessMessage(null);
        try {
            const project = await createProject(result.value);
            await refreshProjects();
            selectProject(project.id);
            form.reset();
            setShowCreateForm(false);
            setSuccessMessage(`Le Project « ${project.name} » a été créé.`);
            navigate(`/projects/${project.id}`);
        } catch (caught) {
            setFormError(errorMessage(caught, "La création du Project a échoué."));
        } finally {
            createSubmission.current = false;
            setIsMutating(false);
        }
    }

    async function handleDisable() {
        if (!selectedProject || isMutating) return;

        setIsMutating(true);
        setFormError(null);
        try {
            await disableProject(selectedProject.id);
            await refreshProjects();
            setConfirmDisable(false);
            setSuccessMessage(`Le Project « ${selectedProject.name} » est désactivé.`);
        } catch (caught) {
            setFormError(errorMessage(caught, "La désactivation du Project a échoué."));
            setConfirmDisable(false);
        } finally {
            setIsMutating(false);
        }
    }

    const projects = state.status === "ready" ? state.projects : [];
    const routeProjectMissing = routeProjectId !== null && state.status === "ready" && !selectedProject;

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-100">{user?.role === "ADMIN" ? "Tous les Projects" : "Mes Projects accessibles"}</h1>
                    <p className="mt-2 text-slate-400">Sélection, propriété et collaboration.</p>
                </div>
                <Button onClick={() => setShowCreateForm((visible) => !visible)}>{showCreateForm ? "Fermer le formulaire" : "Créer un Project"}</Button>
            </header>

            {successMessage && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">{successMessage}</p>}
            {formError && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">{formError}</p>}

            {showCreateForm && (
                <form className="grid gap-4 rounded-2xl border border-cyan-400/20 bg-slate-950/60 p-6" onSubmit={handleCreate} noValidate>
                    <h2 className="text-xl font-bold">Nouveau Project</h2>
                    <div>
                        <label htmlFor="project-name" className="mb-2 block text-sm font-medium">Nom</label>
                        <Input id="project-name" name="project-name" required maxLength={100} disabled={isMutating} aria-describedby="project-name-help" />
                        <p id="project-name-help" className="mt-1 text-xs text-slate-400">100 caractères maximum.</p>
                    </div>
                    <div>
                        <label htmlFor="project-description" className="mb-2 block text-sm font-medium">Description</label>
                        <textarea id="project-description" name="project-description" maxLength={255} disabled={isMutating} className="min-h-24 w-full rounded-md border border-cyan-400/20 bg-slate-950 px-3 py-2 text-sm" aria-describedby="project-description-help" />
                        <p id="project-description-help" className="mt-1 text-xs text-slate-400">Optionnelle, 255 caractères maximum.</p>
                    </div>
                    <Button className="justify-self-start" type="submit" disabled={isMutating}>{isMutating ? "Création…" : "Créer"}</Button>
                </form>
            )}

            <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
                <aside className="rounded-2xl border border-cyan-400/10 bg-slate-950/50 p-4" aria-label="Projects accessibles">
                    {state.status === "loading" && <p aria-live="polite" className="text-slate-300">Chargement des Projects…</p>}
                    {state.status === "error" && <div role="alert"><p className="text-red-300">{state.message}</p><Button className="mt-3" variant="outline" onClick={() => void refreshProjects()}>Réessayer</Button></div>}
                    {state.status === "ready" && projects.length === 0 && <p className="text-slate-400">Aucun Project accessible. Vous pouvez créer le premier.</p>}
                    {state.status === "ready" && projects.length > 0 && (
                        <ul className="space-y-2">
                            {projects.map((project) => (
                                <li key={project.id}>
                                    <button
                                        type="button"
                                        className={`w-full rounded-xl border p-3 text-left transition ${selectedProject?.id === project.id ? "border-cyan-300/50 bg-cyan-400/10" : "border-cyan-400/10 hover:border-cyan-300/30"}`}
                                        onClick={() => { selectProject(project.id); navigate(`/projects/${project.id}`); }}
                                    >
                                        <span className="block font-semibold text-slate-100">{project.name}</span>
                                        <span className={project.is_active ? "text-xs text-emerald-300" : "text-xs text-amber-300"}>{project.is_active ? "Actif" : "Désactivé"}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </aside>

                <section className="min-w-0 rounded-2xl border border-cyan-400/10 bg-slate-950/50 p-6">
                    {!routeIdIsValid || routeProjectMissing ? (
                        <div role="alert"><h2 className="text-xl font-bold">Project indisponible</h2><p className="mt-2 text-slate-400">Ce Project n’existe pas ou n’est pas accessible avec votre session.</p></div>
                    ) : selectedProject ? (
                        <>
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-100">{selectedProject.name}</h2>
                                    <p className="mt-2 whitespace-pre-wrap text-slate-300">{selectedProject.description || "Aucune description."}</p>
                                    <p className={`mt-3 text-sm ${selectedProject.is_active ? "text-emerald-300" : "text-amber-300"}`}>{selectedProject.is_active ? "Project actif" : "Project désactivé"}</p>
                                </div>
                            </div>
                            <ProjectMembersPanel key={selectedProject.id} project={selectedProject} onRequestDisable={() => setConfirmDisable(true)} />
                        </>
                    ) : <div><h2 className="text-xl font-bold">Sélectionnez un Project</h2><p className="mt-2 text-slate-400">Choisissez un Project dans la liste pour consulter ses membres.</p></div>}
                </section>
            </div>

            {confirmDisable && selectedProject && (
                <ConfirmationDialog
                    title="Désactiver ce Project ?"
                    description={`« ${selectedProject.name} » restera consultable, mais aucune réactivation n’est actuellement exposée par le backend.`}
                    confirmLabel="Désactiver"
                    isSubmitting={isMutating}
                    onCancel={() => setConfirmDisable(false)}
                    onConfirm={() => void handleDisable()}
                />
            )}
        </div>
    );
}
