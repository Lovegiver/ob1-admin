import { useCallback, useEffect, useRef, useState, type SubmitEvent } from "react";

import { useAuth } from "@/auth/useAuth";
import { ConfirmationDialog } from "@/components/projects/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateMemberDraft } from "@/project/projectValidation";
import { ApiError } from "@/services/apiClient";
import {
    addProjectMember,
    isProjectMemberRole,
    listProjectMembers,
    projectMemberRoles,
    removeProjectMember,
    updateProjectMemberRole,
    type ProjectMember,
    type ProjectMemberRole,
} from "@/services/projectMemberService";
import type { Project } from "@/services/projectService";

type MembersState =
    | { status: "loading" }
    | { status: "ready"; members: ProjectMember[] }
    | { status: "error"; message: string };

type PendingAction =
    | { kind: "role"; member: ProjectMember; role: ProjectMemberRole }
    | { kind: "remove"; member: ProjectMember };

function publicMessage(caught: unknown, fallback: string): string {
    return caught instanceof ApiError ? caught.message : fallback;
}

export function ProjectMembersPanel({
    project,
    onRequestDisable,
}: {
    project: Project;
    onRequestDisable: () => void;
}) {
    const { user } = useAuth();
    const [state, setState] = useState<MembersState>({ status: "loading" });
    const [mutationError, setMutationError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [isMutating, setIsMutating] = useState(false);
    const addSubmission = useRef(false);
    const requestSequence = useRef(0);

    const loadMembers = useCallback(async (signal?: AbortSignal) => {
        const sequence = ++requestSequence.current;
        setState({ status: "loading" });
        try {
            const members = await listProjectMembers(project.id, signal);
            if (sequence === requestSequence.current) setState({ status: "ready", members });
        } catch (caught) {
            if (caught instanceof DOMException && caught.name === "AbortError") return;
            if (sequence === requestSequence.current) {
                setState({ status: "error", message: publicMessage(caught, "Impossible de charger les membres.") });
            }
        }
    }, [project.id]);

    useEffect(() => {
        const abortController = new AbortController();
        const timeoutId = window.setTimeout(() => {
            void loadMembers(abortController.signal);
        }, 0);
        return () => {
            window.clearTimeout(timeoutId);
            abortController.abort();
        };
    }, [loadMembers]);

    const members = state.status === "ready" ? state.members : [];
    const currentMembership = members.find((member) => member.user_id === user?.id);
    const canManage = project.is_active && (user?.role === "ADMIN" || currentMembership?.role === "OWNER");
    const ownerCount = members.filter((member) => member.role === "OWNER").length;

    async function handleAddMember(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        if (addSubmission.current || !canManage) return;

        const form = event.currentTarget;
        const data = new FormData(form);
        const result = validateMemberDraft(String(data.get("member-email") ?? ""), data.get("member-role"));
        if (!result.value) {
            setMutationError(result.error ?? "Informations de membre invalides.");
            return;
        }

        addSubmission.current = true;
        setIsMutating(true);
        setMutationError(null);
        try {
            await addProjectMember(project.id, result.value);
            form.reset();
            await loadMembers();
        } catch (caught) {
            setMutationError(publicMessage(caught, "Impossible d’ajouter ce compte."));
        } finally {
            addSubmission.current = false;
            setIsMutating(false);
        }
    }

    async function confirmPendingAction() {
        if (!pendingAction || isMutating) return;

        setIsMutating(true);
        setMutationError(null);
        try {
            if (pendingAction.kind === "role") {
                await updateProjectMemberRole(project.id, pendingAction.member.user_id, pendingAction.role);
            } else {
                await removeProjectMember(project.id, pendingAction.member.user_id);
            }
            setPendingAction(null);
            await loadMembers();
        } catch (caught) {
            setMutationError(publicMessage(caught, "La modification du membre a échoué."));
            setPendingAction(null);
        } finally {
            setIsMutating(false);
        }
    }

    return (
        <section className="mt-8 border-t border-cyan-400/10 pt-8" aria-labelledby="members-title">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 id="members-title" className="text-xl font-bold">Membres</h2>
                    <p className="mt-1 text-sm text-slate-400">Ajoutez uniquement un compte OB1 existant. Aucune invitation n’est envoyée.</p>
                </div>
                <div className="flex gap-2">
                    {canManage && <Button variant="outline" onClick={onRequestDisable}>Désactiver le Project</Button>}
                    <Button variant="outline" onClick={() => void loadMembers()} disabled={state.status === "loading"}>Rafraîchir</Button>
                </div>
            </div>

            {mutationError && <p role="alert" className="mt-4 text-sm text-red-300">{mutationError}</p>}
            {state.status === "loading" && <p className="mt-6 text-slate-300" aria-live="polite">Chargement des membres…</p>}
            {state.status === "error" && (
                <div className="mt-6" role="alert">
                    <p className="text-red-300">{state.message}</p>
                    <Button className="mt-3" variant="outline" onClick={() => void loadMembers()}>Réessayer</Button>
                </div>
            )}
            {state.status === "ready" && members.length === 0 && <p className="mt-6 text-slate-400">Aucun membre n’est visible pour ce Project.</p>}
            {state.status === "ready" && members.length > 0 && (
                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-slate-400"><tr><th className="pb-3">Compte</th><th className="pb-3">Rôle</th><th className="pb-3 text-right">Actions</th></tr></thead>
                        <tbody className="divide-y divide-cyan-400/10">
                            {members.map((member) => {
                                const isLastOwner = member.role === "OWNER" && ownerCount === 1;
                                return (
                                    <tr key={member.user_id}>
                                        <td className="py-4 text-slate-200">{member.email}</td>
                                        <td className="py-4">
                                            {canManage ? (
                                                <select
                                                    aria-label={`Rôle de ${member.email}`}
                                                    className="rounded-md border border-cyan-400/20 bg-slate-950 px-3 py-2"
                                                    value={member.role}
                                                    disabled={isMutating || isLastOwner}
                                                    onChange={(event) => {
                                                        const role = event.target.value;
                                                        if (role !== member.role && isProjectMemberRole(role)) {
                                                            setPendingAction({ kind: "role", member, role });
                                                        }
                                                    }}
                                                >
                                                    {projectMemberRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                                                </select>
                                            ) : member.role}
                                            {isLastOwner && <p className="mt-1 text-xs text-amber-300">Dernier OWNER : rôle protégé.</p>}
                                        </td>
                                        <td className="py-4 text-right">
                                            {canManage && <Button variant="outline" disabled={isMutating || isLastOwner} onClick={() => setPendingAction({ kind: "remove", member })}>Retirer</Button>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {canManage && (
                <form className="mt-8 grid gap-4 rounded-xl border border-cyan-400/10 bg-slate-950/40 p-4 md:grid-cols-[1fr_auto_auto]" onSubmit={handleAddMember} noValidate>
                    <div>
                        <label htmlFor="member-email" className="mb-2 block text-sm font-medium">E-mail du compte existant</label>
                        <Input id="member-email" name="member-email" type="email" autoComplete="off" maxLength={254} required disabled={isMutating} />
                    </div>
                    <div>
                        <label htmlFor="member-role" className="mb-2 block text-sm font-medium">Rôle</label>
                        <select id="member-role" name="member-role" className="h-9 rounded-md border border-cyan-400/20 bg-slate-950 px-3" disabled={isMutating}>
                            {projectMemberRoles.map((role) => <option key={role} value={role}>{role}</option>)}
                        </select>
                    </div>
                    <Button className="self-end" type="submit" disabled={isMutating}>Ajouter le compte</Button>
                </form>
            )}

            {pendingAction && (
                <ConfirmationDialog
                    title={pendingAction.kind === "remove" ? "Retirer ce membre ?" : "Changer ce rôle ?"}
                    description={pendingAction.kind === "remove" ? `${pendingAction.member.email} perdra l’accès à ce Project.` : `${pendingAction.member.email} passera de ${pendingAction.member.role} à ${pendingAction.role}.`}
                    confirmLabel="Confirmer"
                    isSubmitting={isMutating}
                    onCancel={() => setPendingAction(null)}
                    onConfirm={() => void confirmPendingAction()}
                />
            )}
        </section>
    );
}
