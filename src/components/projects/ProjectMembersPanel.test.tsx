import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/auth/authContext";
import { ProjectMembersPanel } from "@/components/projects/ProjectMembersPanel";
import { ApiError } from "@/services/apiClient";
import {
    addProjectMember,
    listProjectMembers,
    removeProjectMember,
    updateProjectMemberRole,
    type ProjectMember,
} from "@/services/projectMemberService";
import type { Project } from "@/services/projectService";

vi.mock("@/services/projectMemberService", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/projectMemberService")>();
    return {
        ...actual,
        addProjectMember: vi.fn(),
        listProjectMembers: vi.fn(),
        removeProjectMember: vi.fn(),
        updateProjectMemberRole: vi.fn(),
    };
});

const listMock = vi.mocked(listProjectMembers);
const addMock = vi.mocked(addProjectMember);
const removeMock = vi.mocked(removeProjectMember);
const updateMock = vi.mocked(updateProjectMemberRole);
const project: Project = { id: 1, name: "Hermes", description: null, is_active: true };
const owner: ProjectMember = { user_id: 7, email: "alice@example.com", role: "OWNER" };
const developer: ProjectMember = { user_id: 8, email: "bob@example.com", role: "DEVELOPER" };
const logout = vi.fn();
const auth: AuthContextValue = {
    status: "AUTHENTICATED",
    user: { id: 7, email: owner.email, role: "USER" },
    error: null,
    login: vi.fn(),
    logout,
    clearError: vi.fn(),
};

function renderPanel(currentProject = project) {
    return render(
        <AuthContext.Provider value={auth}>
            <ProjectMembersPanel project={currentProject} onRequestDisable={vi.fn()} />
        </AuthContext.Provider>,
    );
}

describe("ProjectMembersPanel", () => {
    beforeEach(() => {
        listMock.mockReset();
        addMock.mockReset();
        removeMock.mockReset();
        updateMock.mockReset();
        logout.mockReset();
    });

    it("affiche la liste et l'état vide", async () => {
        listMock.mockResolvedValueOnce([owner, developer]);
        const populated = renderPanel();
        expect(await screen.findByText("bob@example.com")).toBeInTheDocument();
        populated.unmount();
        listMock.mockResolvedValueOnce([]);
        renderPanel();
        expect(await screen.findByText(/Aucun membre/)).toBeInTheDocument();
    });

    it("ajoute un compte existant avec e-mail normalisé et rôle allowlisté", async () => {
        listMock.mockResolvedValue([owner, developer]);
        addMock.mockResolvedValue(developer);
        renderPanel();
        await screen.findByText("bob@example.com");
        await userEvent.type(screen.getByLabelText("E-mail du compte existant"), " Bob@Example.COM ");
        await userEvent.selectOptions(screen.getByLabelText("Rôle"), "DEVELOPER");
        await userEvent.click(screen.getByRole("button", { name: "Ajouter le compte" }));

        await waitFor(() => expect(addMock).toHaveBeenCalledWith(1, { email: "bob@example.com", role: "DEVELOPER" }));
        const options = within(screen.getByLabelText("Rôle")).getAllByRole("option").map((option) => option.textContent);
        expect(options).toEqual(["OWNER", "DEVELOPER", "VIEWER"]);
    });

    it("empêche une double soumission d'ajout", async () => {
        listMock.mockResolvedValue([owner]);
        addMock.mockReturnValue(new Promise(() => undefined));
        renderPanel();
        await screen.findByText(owner.email);
        fireEvent.change(screen.getByLabelText("E-mail du compte existant"), { target: { value: "bob@example.com" } });
        const button = screen.getByRole("button", { name: "Ajouter le compte" });
        const form = button.closest("form");
        expect(form).not.toBeNull();
        if (form) {
            fireEvent.submit(form);
            fireEvent.submit(form);
        }
        expect(addMock).toHaveBeenCalledTimes(1);
    });

    it("confirme puis modifie un rôle", async () => {
        listMock.mockResolvedValue([owner, developer]);
        updateMock.mockResolvedValue({ ...developer, role: "VIEWER" });
        renderPanel();
        const roleSelect = await screen.findByLabelText(`Rôle de ${developer.email}`);
        await userEvent.selectOptions(roleSelect, "VIEWER");
        await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirmer" }));

        await waitFor(() => expect(updateMock).toHaveBeenCalledWith(1, 8, "VIEWER"));
    });

    it("confirme puis retire un membre", async () => {
        listMock.mockResolvedValue([owner, developer]);
        removeMock.mockResolvedValue(undefined);
        renderPanel();
        await screen.findByText(developer.email);
        const removeButtons = screen.getAllByRole("button", { name: "Retirer" });
        await userEvent.click(removeButtons[1]);
        await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirmer" }));

        await waitFor(() => expect(removeMock).toHaveBeenCalledWith(1, 8));
    });

    it("protège ergonomiquement le dernier OWNER", async () => {
        listMock.mockResolvedValue([owner]);
        renderPanel();
        expect(await screen.findByText(/Dernier OWNER/)).toBeInTheDocument();
        expect(screen.getByLabelText(`Rôle de ${owner.email}`)).toBeDisabled();
        expect(screen.getByRole("button", { name: "Retirer" })).toBeDisabled();
    });

    it("affiche le refus backend concurrent sans perdre la session", async () => {
        const secondOwner = { ...developer, role: "OWNER" as const };
        listMock.mockResolvedValue([owner, secondOwner]);
        updateMock.mockRejectedValue(new ApiError({ status: 400, message: "Cannot downgrade the last project OWNER", isNetworkError: false }));
        renderPanel();
        await userEvent.selectOptions(await screen.findByLabelText(`Rôle de ${owner.email}`), "VIEWER");
        await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Confirmer" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("last project OWNER");
        expect(logout).not.toHaveBeenCalled();
    });

    it("conserve la session sur 403 local et ne simule aucune invitation", async () => {
        listMock.mockResolvedValue([owner]);
        addMock.mockRejectedValue(new ApiError({ status: 403, message: "Insufficient project permissions", isNetworkError: false }));
        renderPanel();
        await screen.findByText(owner.email);
        expect(screen.queryByRole("button", { name: /inviter/i })).not.toBeInTheDocument();
        expect(screen.getByText(/Aucune invitation n’est envoyée/)).toBeInTheDocument();
        await userEvent.type(screen.getByLabelText("E-mail du compte existant"), "bob@example.com");
        await userEvent.click(screen.getByRole("button", { name: "Ajouter le compte" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Insufficient project permissions");
        expect(logout).not.toHaveBeenCalled();
    });

    it("désactive les actions membres d'un Project inactif", async () => {
        listMock.mockResolvedValue([owner]);
        renderPanel({ ...project, is_active: false });
        await screen.findByText(owner.email);
        expect(screen.queryByRole("button", { name: "Ajouter le compte" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Désactiver le Project" })).not.toBeInTheDocument();
    });
});
