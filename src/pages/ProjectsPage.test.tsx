import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "@/auth/authContext";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectContext, type ProjectContextValue } from "@/project/projectContext";
import { ApiError } from "@/services/apiClient";
import { listProjectMembers } from "@/services/projectMemberService";
import { createProject, disableProject, type Project } from "@/services/projectService";

vi.mock("@/services/projectService", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/projectService")>();
    return { ...actual, createProject: vi.fn(), disableProject: vi.fn() };
});
vi.mock("@/services/projectMemberService", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/projectMemberService")>();
    return { ...actual, listProjectMembers: vi.fn() };
});

const createProjectMock = vi.mocked(createProject);
const disableProjectMock = vi.mocked(disableProject);
const listMembersMock = vi.mocked(listProjectMembers);
const hermes: Project = { id: 1, name: "Hermes", description: "Runtime", is_active: true };

const auth: AuthContextValue = {
    status: "AUTHENTICATED",
    user: { id: 7, email: "alice@example.com", role: "USER" },
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
};

function contextValue(overrides: Partial<ProjectContextValue> = {}): ProjectContextValue {
    return {
        state: { status: "ready", projects: [hermes] },
        selectedProject: null,
        selectProject: vi.fn(),
        refreshProjects: vi.fn().mockResolvedValue([hermes]),
        ...overrides,
    };
}

function renderPage(projects = contextValue(), path = "/projects") {
    return render(
        <AuthContext.Provider value={auth}>
            <ProjectContext.Provider value={projects}>
                <MemoryRouter initialEntries={[path]}>
                    <Routes>
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/:projectId" element={<ProjectsPage />} />
                    </Routes>
                </MemoryRouter>
            </ProjectContext.Provider>
        </AuthContext.Provider>,
    );
}

describe("ProjectsPage", () => {
    beforeEach(() => {
        createProjectMock.mockReset();
        disableProjectMock.mockReset();
        listMembersMock.mockReset();
        listMembersMock.mockResolvedValue([]);
    });

    it("affiche une liste réelle et rend les caractères spéciaux comme texte", () => {
        const unsafe = { ...hermes, name: "<script>alert(1)</script>" };
        const view = renderPage(contextValue({ state: { status: "ready", projects: [unsafe] } }));

        expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
        expect(view.container.querySelector("script")).toBeNull();
    });

    it("présente les états loading, vide et erreur", () => {
        const loading = renderPage(contextValue({ state: { status: "loading" } }));
        expect(screen.getByText("Chargement des Projects…")).toBeInTheDocument();
        loading.unmount();
        const empty = renderPage(contextValue({ state: { status: "ready", projects: [] } }));
        expect(screen.getByText(/Aucun Project accessible/)).toBeInTheDocument();
        empty.unmount();
        renderPage(contextValue({ state: { status: "error", message: "Service indisponible" } }));
        expect(screen.getByRole("alert")).toHaveTextContent("Service indisponible");
    });

    it("crée un Project et rafraîchit la vue", async () => {
        const projects = contextValue();
        createProjectMock.mockResolvedValue(hermes);
        renderPage(projects);
        await userEvent.click(screen.getByRole("button", { name: "Créer un Project" }));
        await userEvent.type(screen.getByLabelText("Nom"), " Hermes ");
        await userEvent.type(screen.getByLabelText("Description"), " Runtime ");
        await userEvent.click(screen.getByRole("button", { name: "Créer" }));

        await waitFor(() => expect(createProjectMock).toHaveBeenCalledWith({ name: "Hermes", description: "Runtime" }));
        expect(projects.refreshProjects).toHaveBeenCalled();
        expect(projects.selectProject).toHaveBeenCalledWith(1);
        expect(screen.getByRole("status")).toHaveTextContent("a été créé");
    });

    it("empêche une double création", async () => {
        createProjectMock.mockReturnValue(new Promise(() => undefined));
        renderPage();
        await userEvent.click(screen.getByRole("button", { name: "Créer un Project" }));
        fireEvent.change(screen.getByLabelText("Nom"), { target: { value: "Hermes" } });
        const createButton = screen.getByRole("button", { name: "Créer" });
        const form = createButton.closest("form");
        expect(form).not.toBeNull();
        if (form) {
            fireEvent.submit(form);
            fireEvent.submit(form);
        }
        expect(createProjectMock).toHaveBeenCalledTimes(1);
    });

    it("conserve le formulaire utile après une erreur métier", async () => {
        createProjectMock.mockRejectedValue(new ApiError({ status: 400, message: "already exists", isNetworkError: false }));
        renderPage();
        await userEvent.click(screen.getByRole("button", { name: "Créer un Project" }));
        await userEvent.type(screen.getByLabelText("Nom"), "Hermes");
        await userEvent.click(screen.getByRole("button", { name: "Créer" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("already exists");
        expect(screen.getByLabelText("Nom")).toHaveValue("Hermes");
    });

    it("confirme et exécute la désactivation pour un OWNER", async () => {
        listMembersMock.mockResolvedValue([{ user_id: 7, email: "alice@example.com", role: "OWNER" }]);
        disableProjectMock.mockResolvedValue({ ...hermes, is_active: false });
        const projects = contextValue({ selectedProject: hermes });
        renderPage(projects, "/projects/1");
        await userEvent.click(await screen.findByRole("button", { name: "Désactiver le Project" }));
        const dialog = screen.getByRole("alertdialog");
        await userEvent.click(within(dialog).getByRole("button", { name: "Désactiver" }));

        await waitFor(() => expect(disableProjectMock).toHaveBeenCalledWith(1));
        expect(projects.refreshProjects).toHaveBeenCalled();
    });

    it("masque les mutations non supportées et les actions d'écriture d'un VIEWER", async () => {
        listMembersMock.mockResolvedValue([{ user_id: 7, email: "alice@example.com", role: "VIEWER" }]);
        renderPage(contextValue({ selectedProject: hermes }), "/projects/1");
        await screen.findByText("alice@example.com");

        expect(screen.queryByRole("button", { name: "Désactiver le Project" })).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /modifier|réactiver|supprimer/i })).not.toBeInTheDocument();
        expect(screen.queryByText(/API key/i)).not.toBeInTheDocument();
    });
});
