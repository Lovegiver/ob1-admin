import { useMemo, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue, type AuthStatus } from "@/auth/authContext";
import { ProjectProvider } from "@/project/ProjectProvider";
import { projectPreferenceKey } from "@/project/projectPreference";
import { useProjects } from "@/project/useProjects";
import { listProjects, type Project } from "@/services/projectService";

vi.mock("@/services/projectService", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/projectService")>();
    return { ...actual, listProjects: vi.fn() };
});

const listProjectsMock = vi.mocked(listProjects);
const hermes: Project = { id: 1, name: "Hermes", description: null, is_active: true };
const apollo: Project = { id: 2, name: "Apollo", description: "Delivery", is_active: true };

function authValue(status: AuthStatus): AuthContextValue {
    return {
        status,
        user: status === "AUTHENTICATED" ? { id: 7, email: "alice@example.com", role: "USER" } : null,
        error: null,
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
    };
}

function Probe() {
    const { state, selectedProject, selectProject, refreshProjects } = useProjects();
    return (
        <div>
            <span data-testid="state">{state.status}</span>
            <span data-testid="projects">{state.status === "ready" ? state.projects.map((project) => project.name).join(",") : ""}</span>
            <span data-testid="selected">{selectedProject ? `${selectedProject.name}:${selectedProject.is_active}` : "none"}</span>
            <button onClick={() => selectProject(1)}>select-1</button>
            <button onClick={() => void refreshProjects().catch(() => undefined)}>refresh</button>
        </div>
    );
}

function Harness({ status = "AUTHENTICATED" }: { status?: AuthStatus }) {
    return <AuthContext.Provider value={authValue(status)}><ProjectProvider><Probe /></ProjectProvider></AuthContext.Provider>;
}

function LogoutHarness() {
    const [status, setStatus] = useState<AuthStatus>("AUTHENTICATED");
    const value = useMemo(() => authValue(status), [status]);
    return (
        <AuthContext.Provider value={value}>
            <ProjectProvider>
                <Probe />
                <button onClick={() => setStatus("ANONYMOUS")}>logout</button>
            </ProjectProvider>
        </AuthContext.Provider>
    );
}

function deferred<T>() {
    let resolve: (value: T) => void = () => {};
    const promise = new Promise<T>((complete) => { resolve = complete; });
    return { promise, resolve };
}

describe("ProjectProvider", () => {
    beforeEach(() => listProjectsMock.mockReset());

    it("expose le chargement puis un état vide", async () => {
        const pending = deferred<Project[]>();
        listProjectsMock.mockReturnValue(pending.promise);
        render(<Harness />);

        await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("loading"));
        pending.resolve([]);
        await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ready"));
        expect(screen.getByTestId("projects")).toBeEmptyDOMElement();
    });

    it("sélectionne un Project et persiste uniquement son identifiant", async () => {
        listProjectsMock.mockResolvedValue([hermes]);
        render(<Harness />);
        await waitFor(() => expect(screen.getByTestId("projects")).toHaveTextContent("Hermes"));
        await userEvent.click(screen.getByRole("button", { name: "select-1" }));

        expect(screen.getByTestId("selected")).toHaveTextContent("Hermes:true");
        expect(sessionStorage.getItem(projectPreferenceKey)).toBe("1");
    });

    it("restaure et revalide une préférence accessible", async () => {
        sessionStorage.setItem(projectPreferenceKey, "2");
        listProjectsMock.mockResolvedValue([hermes, apollo]);
        render(<Harness />);

        await waitFor(() => expect(screen.getByTestId("selected")).toHaveTextContent("Apollo:true"));
    });

    it("supprime une préférence inaccessible", async () => {
        sessionStorage.setItem(projectPreferenceKey, "99");
        listProjectsMock.mockResolvedValue([hermes]);
        render(<Harness />);

        await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ready"));
        expect(screen.getByTestId("selected")).toHaveTextContent("none");
        expect(sessionStorage.getItem(projectPreferenceKey)).toBeNull();
    });

    it("ignore une réponse de liste devenue obsolète", async () => {
        const first = deferred<Project[]>();
        const second = deferred<Project[]>();
        listProjectsMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        render(<Harness />);
        await waitFor(() => expect(listProjectsMock).toHaveBeenCalledTimes(1));
        await userEvent.click(screen.getByRole("button", { name: "refresh" }));
        second.resolve([apollo]);
        await waitFor(() => expect(screen.getByTestId("projects")).toHaveTextContent("Apollo"));
        first.resolve([hermes]);
        await waitFor(() => expect(screen.getByTestId("projects")).not.toHaveTextContent("Hermes"));
    });

    it("nettoie le contexte et la préférence au logout", async () => {
        listProjectsMock.mockResolvedValue([hermes]);
        render(<LogoutHarness />);
        await waitFor(() => expect(screen.getByTestId("projects")).toHaveTextContent("Hermes"));
        await userEvent.click(screen.getByRole("button", { name: "select-1" }));
        await userEvent.click(screen.getByRole("button", { name: "logout" }));

        await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("idle"));
        expect(screen.getByTestId("selected")).toHaveTextContent("none");
        expect(sessionStorage.getItem(projectPreferenceKey)).toBeNull();
    });

    it("conserve le détail réel lorsqu'un Project courant devient désactivé", async () => {
        listProjectsMock.mockResolvedValueOnce([hermes]).mockResolvedValueOnce([{ ...hermes, is_active: false }]);
        render(<Harness />);
        await waitFor(() => expect(screen.getByTestId("projects")).toHaveTextContent("Hermes"));
        await userEvent.click(screen.getByRole("button", { name: "select-1" }));
        await userEvent.click(screen.getByRole("button", { name: "refresh" }));

        await waitFor(() => expect(screen.getByTestId("selected")).toHaveTextContent("Hermes:false"));
    });

    it("oublie un Project courant qui disparaît de la liste accessible", async () => {
        listProjectsMock.mockResolvedValueOnce([hermes]).mockResolvedValueOnce([]);
        render(<Harness />);
        await waitFor(() => expect(screen.getByTestId("projects")).toHaveTextContent("Hermes"));
        await userEvent.click(screen.getByRole("button", { name: "select-1" }));
        await userEvent.click(screen.getByRole("button", { name: "refresh" }));

        await waitFor(() => expect(screen.getByTestId("selected")).toHaveTextContent("none"));
    });
});
